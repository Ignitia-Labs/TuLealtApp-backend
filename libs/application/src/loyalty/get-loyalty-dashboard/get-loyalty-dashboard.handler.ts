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
  RecentActivityDto,
} from './get-loyalty-dashboard.response';

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

    // 1. Métricas de Customers
    const totalCustomers = await this.membershipRepository.countByTenantId(request.tenantId);
    const activeCustomers = await this.membershipRepository.countByTenantIdAndStatus(
      request.tenantId,
      'active',
    );

    // 2. Obtener todas las memberships del tenant para calcular puntos activos
    const memberships = await this.membershipRepository.findByTenantId(request.tenantId);
    const activePoints = memberships.reduce((sum, m) => sum + m.points, 0);

    // 3. Calcular puntos emitidos y canjeados desde el ledger
    // Necesitamos obtener todas las transacciones del tenant
    // Como no hay método directo, obtenemos por membership
    let totalPointsIssued = 0;
    let totalPointsRedeemed = 0;
    const rewardRuleStats = new Map<number, { points: number; count: number }>();
    const recentTransactions: RecentActivityDto[] = [];

    // Obtener transacciones de todas las memberships del tenant
    for (const membership of memberships) {
      const transactions = await this.pointsTransactionRepository.findByMembershipId(membership.id);

      for (const tx of transactions) {
        // Calcular puntos emitidos (solo EARNING con puntos positivos)
        if (tx.type === 'EARNING' && tx.pointsDelta > 0) {
          totalPointsIssued += tx.pointsDelta;

          // Agrupar por rewardRuleId para top rewards
          if (tx.rewardRuleId) {
            const current = rewardRuleStats.get(tx.rewardRuleId) || {
              points: 0,
              count: 0,
            };
            rewardRuleStats.set(tx.rewardRuleId, {
              points: current.points + tx.pointsDelta,
              count: current.count + 1,
            });
          }
        }

        // Calcular puntos canjeados (REDEEM y EXPIRATION con puntos negativos)
        if ((tx.type === 'REDEEM' || tx.type === 'EXPIRATION') && tx.pointsDelta < 0) {
          totalPointsRedeemed += Math.abs(tx.pointsDelta);
        }

        // Agregar a actividad reciente (últimas 20 transacciones)
        if (recentTransactions.length < 20) {
          recentTransactions.push({
            transactionId: tx.id,
            type: tx.type,
            pointsDelta: tx.pointsDelta,
            reasonCode: tx.reasonCode || '',
            createdAt: tx.createdAt,
            membershipId: tx.membershipId,
          });
        }
      }
    }

    // Ordenar actividad reciente por fecha descendente
    recentTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const top20RecentActivity = recentTransactions.slice(0, 20);

    // 4. Obtener top reward rules
    const topRewards: TopRewardRuleDto[] = [];
    const sortedRules = Array.from(rewardRuleStats.entries()).sort(
      (a, b) => b[1].points - a[1].points,
    );

    for (const [ruleId, stats] of sortedRules.slice(0, 10)) {
      const rule = await this.rewardRuleRepository.findById(ruleId);
      if (rule) {
        topRewards.push({
          ruleId: rule.id,
          name: rule.name,
          pointsAwarded: stats.points,
          transactionsCount: stats.count,
        });
      }
    }

    return new GetLoyaltyDashboardResponse(
      totalCustomers,
      activeCustomers,
      totalPointsIssued,
      totalPointsRedeemed,
      activePoints,
      topRewards,
      top20RecentActivity,
    );
  }
}
