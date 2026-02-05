import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ITenantRepository,
  ICustomerMembershipRepository,
  IPointsTransactionRepository,
  IRewardRuleRepository,
} from '@libs/domain';
import { GetLoyaltyDashboardRequest } from './get-loyalty-dashboard.request';
import {
  GetLoyaltyDashboardResponse,
  TopRewardRuleDto,
} from './get-loyalty-dashboard.response';
import { TopCustomerDto } from './top-customer-dto';
import { LoyaltyDashboardPointsTransactionDto } from './points-transaction-dto';
import { DailyActivityDto } from './daily-activity-dto';

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
  ) {}

  async execute(request: GetLoyaltyDashboardRequest): Promise<GetLoyaltyDashboardResponse> {
    // Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
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
      const rules = await Promise.all(
        ruleIds.map((ruleId) => this.rewardRuleRepository.findById(ruleId)),
      );
      rules.forEach((rule) => {
        if (rule) {
          rulesMap.set(rule.id, { id: rule.id, name: rule.name });
        }
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
        new TopCustomerDto(customer.userId, customer.userName, customer.points, customer.transactions),
    );

    // Construir recentTransactions DTOs
    const recentTransactionsDto: LoyaltyDashboardPointsTransactionDto[] = recentTransactions.map(
      (tx) =>
        new LoyaltyDashboardPointsTransactionDto(
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
        ),
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
    );
  }
}
