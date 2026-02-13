import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  ITenantRepository,
  ICustomerMembershipRepository,
  IPointsTransactionRepository,
  IRewardRuleRepository,
  IUserRepository,
  IBranchRepository,
} from '@libs/domain';
import { GetLoyaltyDashboardRequest, DashboardPeriod } from './get-loyalty-dashboard.request';
import { GetLoyaltyDashboardResponse, TopRewardRuleDto } from './get-loyalty-dashboard.response';
import { TopCustomerDto } from './top-customer-dto';
import { LoyaltyDashboardPointsTransactionDto } from './points-transaction-dto';
import { DailyActivityDto } from './daily-activity-dto';
import { PeriodDto } from './period-dto';
import { DashboardMetricsCacheService } from '../dashboard-metrics-cache.service';
import { In } from 'typeorm';

/**
 * Handler para obtener métricas del dashboard de lealtad de un tenant
 * Calcula métricas desde el ledger de transacciones de puntos
 */
@Injectable()
export class GetLoyaltyDashboardHandler {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    @Inject('IRewardRuleRepository')
    private readonly rewardRuleRepository: IRewardRuleRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
    private readonly cacheService: DashboardMetricsCacheService,
  ) {}

  /**
   * Calcula las fechas de inicio y fin según el período especificado
   */
  private calculatePeriodDates(
    period: DashboardPeriod,
    startDate?: string,
    endDate?: string,
  ): {
    start: Date;
    end: Date;
    periodType: 'all' | 'month' | 'week' | 'custom';
  } {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    if (period === 'custom') {
      if (!startDate || !endDate) {
        throw new BadRequestException('startDate and endDate are required when period="custom"');
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Invalid date format. Use ISO 8601 format.');
      }
      if (start >= end) {
        throw new BadRequestException('startDate must be before endDate');
      }
      return { start, end, periodType: 'custom' };
    }

    if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      return { start, end: now, periodType: 'month' };
    }

    if (period === 'week') {
      const start = new Date(now);
      start.setDate(start.getDate() - 6); // Últimos 7 días
      start.setHours(0, 0, 0, 0);
      return { start, end: now, periodType: 'week' };
    }

    // period === 'all'
    const start = new Date(0); // Desde el inicio de los tiempos
    return { start, end: now, periodType: 'all' };
  }

  /**
   * Genera descripción legible para una transacción
   */
  private generateTransactionDescription(
    type: string,
    reasonCode: string | null,
    metadata: Record<string, unknown> | null,
    pointsDelta: number,
  ): string {
    if (type === 'REDEEM') {
      const rewardName = metadata?.rewardName as string;
      if (rewardName) {
        return `Canjeó: ${rewardName}`;
      }
      return `Canjeó recompensa (${Math.abs(pointsDelta)} puntos)`;
    }

    if (type === 'EARNING') {
      if (reasonCode === 'PURCHASE_BASE' || reasonCode === 'PURCHASE') {
        const amount = metadata?.amount as number;
        if (amount) {
          return `Compra de Q${amount.toFixed(2)}`;
        }
        return `Compra realizada`;
      }
      if (reasonCode === 'REGISTRATION' || reasonCode === 'SIGNUP') {
        return `Nuevo cliente registrado`;
      }
      if (reasonCode) {
        return `Puntos ganados: ${reasonCode}`;
      }
      return `Puntos ganados (${pointsDelta} puntos)`;
    }

    if (type === 'ADJUSTMENT') {
      const reason = metadata?.reason as string;
      if (reason) {
        return `Ajuste manual: ${reason}`;
      }
      return `Ajuste manual de puntos`;
    }

    if (type === 'REVERSAL') {
      return `Reversión de transacción`;
    }

    if (type === 'EXPIRATION') {
      return `Puntos expirados`;
    }

    return `${type}: ${pointsDelta > 0 ? '+' : ''}${pointsDelta} puntos`;
  }

  async execute(request: GetLoyaltyDashboardRequest): Promise<GetLoyaltyDashboardResponse> {
    // Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Calcular período
    const period = request.period || 'all';
    const {
      start: periodStart,
      end: periodEnd,
      periodType,
    } = this.calculatePeriodDates(period, request.startDate, request.endDate);

    // Intentar obtener métricas por período desde caché (solo para períodos comunes)
    const cacheKey =
      periodType === 'month' || periodType === 'week'
        ? this.cacheService.generateKey(request.tenantId, periodType)
        : null;
    let periodMetrics: {
      pointsEarnedInPeriod: number;
      pointsRedeemedInPeriod: number;
      redemptionsInPeriod: number;
    } | null = cacheKey ? this.cacheService.get(cacheKey) : null;

    if (!periodMetrics) {
      // Obtener métricas por período desde BD
      periodMetrics = await this.pointsTransactionRepository.getTenantMetricsByPeriod(
        request.tenantId,
        periodStart,
        periodEnd,
      );
      // Guardar en caché solo para períodos comunes
      if (cacheKey) {
        this.cacheService.set(cacheKey, periodMetrics);
      }
    }

    // Ejecutar queries en paralelo para optimizar rendimiento
    const [
      totalCustomers,
      activeCustomers,
      memberships,
      tenantMetrics,
      topCustomersWithStats,
      recentTransactions,
      dailyActivityData,
    ] = await Promise.all([
      // 1. Métricas de Customers
      this.membershipRepository.countByTenantId(request.tenantId),
      this.membershipRepository.countByTenantIdAndStatus(request.tenantId, 'active'),
      // 2. Obtener memberships para calcular puntos activos
      this.membershipRepository.findByTenantId(request.tenantId),
      // 3. Métricas agregadas optimizadas (totalRedemptions, pointsEarned, pointsRedeemed, topRewards)
      this.pointsTransactionRepository.getTenantMetrics(request.tenantId),
      // 4. Top customers con estadísticas optimizadas
      this.membershipRepository.getTopCustomersWithStats(request.tenantId, 10),
      // 5. Transacciones recientes optimizadas
      this.pointsTransactionRepository.getRecentTransactionsByTenant(request.tenantId, 50),
      // 6. Actividad diaria de los últimos 7 días
      this.pointsTransactionRepository.getDailyActivityByTenant(request.tenantId, 7),
    ]);

    // Calcular puntos activos (totalPoints)
    const totalPoints = memberships.reduce((sum, m) => sum + m.points, 0);

    // Calcular promedio de puntos por customer
    const avgPointsPerCustomer =
      totalCustomers > 0 ? Math.round((totalPoints / totalCustomers) * 100) / 100 : 0;

    // Obtener nombres de reglas para topRewards (batch query para evitar N+1)
    const ruleIds = tenantMetrics.topRewards.map((r) => r.ruleId);
    const rulesMap = new Map<number, { id: number; name: string }>();
    if (ruleIds.length > 0) {
      // OPTIMIZACIÓN: Usar findByIds en lugar de Promise.all con findById individual
      const rules = await this.rewardRuleRepository.findByIds(ruleIds);
      rules.forEach((rule) => {
        rulesMap.set(rule.id, { id: rule.id, name: rule.name });
      });
    }

    // Construir topRewards con nombres
    const topRewards: TopRewardRuleDto[] = tenantMetrics.topRewards
      .map((reward) => {
        const rule = rulesMap.get(reward.ruleId);
        if (!rule) return null;
        return {
          ruleId: reward.ruleId,
          name: rule.name,
          pointsAwarded: reward.pointsAwarded,
          transactionsCount: reward.transactionsCount,
        };
      })
      .filter((r): r is TopRewardRuleDto => r !== null);

    // Construir topCustomers DTOs
    const topCustomers: TopCustomerDto[] = topCustomersWithStats.map(
      (customer) =>
        new TopCustomerDto(
          customer.userId,
          customer.userName,
          customer.points,
          customer.transactions,
        ),
    );

    // Obtener información de usuarios si se solicita (batch query para evitar N+1)
    const usersMap = new Map<number, { id: number; name: string }>();
    const branchesMap = new Map<number, { id: number; name: string }>();

    if (request.includeCustomer) {
      // Obtener membershipIds únicos de las transacciones
      const membershipIds = [...new Set(recentTransactions.map((tx) => tx.membershipId))];
      if (membershipIds.length > 0) {
        // OPTIMIZACIÓN: Usar findByIds en lugar de Promise.all con findById individual
        const memberships = await this.membershipRepository.findByIds(membershipIds);

        const userIds = memberships
          .filter((m) => m !== null)
          .map((m) => m.userId)
          .filter((id) => id !== undefined);

        if (userIds.length > 0) {
          // OPTIMIZACIÓN: Usar findByIds en lugar de Promise.all con findById individual
          const users = await this.userRepository.findByIds([...new Set(userIds)]);
          users.forEach((user) => {
            usersMap.set(user.id, { id: user.id, name: user.name });
          });
        }

        // Crear mapa de membershipId -> userId para acceso rápido
        const membershipToUserMap = new Map<number, number>();
        memberships.forEach((m) => {
          if (m && m.userId) {
            membershipToUserMap.set(m.id, m.userId);
          }
        });

        // Agregar el mapa al contexto para usarlo después
        (usersMap as any).membershipToUserMap = membershipToUserMap;
      }
    }

    if (request.includeBranch) {
      // Obtener branchIds únicos de las transacciones
      const branchIds = [
        ...new Set(
          recentTransactions
            .map((tx) => tx.branchId)
            .filter((id): id is number => id !== null && id !== undefined),
        ),
      ];
      if (branchIds.length > 0) {
        const branches = await Promise.all(
          branchIds.map((id) => this.branchRepository.findById(id)),
        );
        branches
          .filter((branch): branch is NonNullable<typeof branch> => branch !== null)
          .forEach((branch) => {
            branchesMap.set(branch.id, { id: branch.id, name: branch.name });
          });
      }
    }

    // Construir recentTransactions DTOs con información del cliente, branch y descripciones
    const membershipToUserMap = (usersMap as any).membershipToUserMap as
      | Map<number, number>
      | undefined;
    const recentTransactionsDto: LoyaltyDashboardPointsTransactionDto[] = recentTransactions.map(
      (tx) => {
        let userName: string | undefined;
        if (request.includeCustomer && membershipToUserMap) {
          const userId = membershipToUserMap.get(tx.membershipId);
          if (userId) {
            const user = usersMap.get(userId);
            userName = user?.name;
          }
        }

        let branchName: string | undefined;
        if (request.includeBranch && tx.branchId) {
          const branch = branchesMap.get(tx.branchId);
          branchName = branch?.name;
        }

        const description = this.generateTransactionDescription(
          tx.type,
          tx.reasonCode,
          tx.metadata,
          tx.pointsDelta,
        );
        return new LoyaltyDashboardPointsTransactionDto(
          tx.id,
          tx.type,
          tx.pointsDelta,
          tx.reasonCode,
          tx.sourceEventId,
          tx.createdAt,
          tx.expiresAt,
          tx.metadata,
          tx.programId,
          tx.rewardRuleId,
          tx.membershipId,
          userName,
          description,
          tx.branchId || undefined,
          branchName,
        );
      },
    );

    // Construir dailyActivity DTOs con información de día de la semana
    // Generar array de los últimos 7 días para asegurar que todos los días estén presentes
    const today = new Date();
    const dailyActivityMap = new Map<string, { pointsEarned: number; pointsRedeemed: number }>();

    // Mapear datos obtenidos de la BD
    dailyActivityData.forEach((day) => {
      dailyActivityMap.set(day.date, {
        pointsEarned: day.pointsEarned,
        pointsRedeemed: day.pointsRedeemed,
      });
    });

    // Generar array completo de los últimos 7 días
    const dailyActivity: DailyActivityDto[] = [];
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dateStr = date.toISOString().split('T')[0];
      const dayData = dailyActivityMap.get(dateStr) || { pointsEarned: 0, pointsRedeemed: 0 };
      const dayOfWeek = date.getDay();

      dailyActivity.push(
        new DailyActivityDto(
          dateStr,
          dayOfWeek,
          dayNames[dayOfWeek],
          dayData.pointsEarned,
          dayData.pointsRedeemed,
        ),
      );
    }

    // Calcular returnRate correctamente: (clientes con >=2 tx / clientes con >=1 tx) * 100
    const returnRate = await this.pointsTransactionRepository.calculateReturnRate(
      request.tenantId,
      periodStart,
      periodEnd,
    );

    // Construir PeriodDto
    const periodDto = new PeriodDto(periodStart.toISOString(), periodEnd.toISOString(), periodType);

    return new GetLoyaltyDashboardResponse(
      totalCustomers,
      activeCustomers,
      totalPoints,
      tenantMetrics.pointsEarned,
      tenantMetrics.pointsRedeemed,
      tenantMetrics.totalRedemptions,
      avgPointsPerCustomer,
      topRewards,
      topCustomers,
      recentTransactionsDto,
      new Date(), // lastCalculatedAt
      dailyActivity,
      periodMetrics.pointsEarnedInPeriod,
      periodMetrics.pointsRedeemedInPeriod,
      periodMetrics.redemptionsInPeriod,
      returnRate,
      periodDto,
    );
  }
}
