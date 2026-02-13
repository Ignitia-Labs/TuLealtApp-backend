import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IPointsTransactionRepository,
  ITenantRepository,
  IRewardRuleRepository,
  ILoyaltyProgramRepository,
} from '@libs/domain';
import { GetAdvancedRewardAnalyticsRequest } from './get-advanced-reward-analytics.request';
import {
  GetAdvancedRewardAnalyticsResponse,
  AdvancedRewardMetricsDto,
} from './get-advanced-reward-analytics.response';
import { PeriodDto } from '../../loyalty/get-loyalty-dashboard/period-dto';
import { CustomerSegment } from '../get-customer-segmentation/get-customer-segmentation.response';

/**
 * Handler para obtener analytics avanzados de reward rules
 * Analiza reglas de acumulación y su impacto en revenue y engagement
 *
 * NOTA: Versión funcional básica. Métricas calculadas con aproximaciones.
 */
@Injectable()
export class GetAdvancedRewardAnalyticsHandler {
  constructor(
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IRewardRuleRepository')
    private readonly rewardRuleRepository: IRewardRuleRepository,
    @Inject('ILoyaltyProgramRepository')
    private readonly loyaltyProgramRepository: ILoyaltyProgramRepository,
  ) {}

  async execute(
    request: GetAdvancedRewardAnalyticsRequest,
  ): Promise<GetAdvancedRewardAnalyticsResponse> {
    // 1. Validar tenant
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // 2. Calcular período
    const { startDate, endDate, periodType } = this.calculatePeriod(
      request.period,
      request.startDate,
      request.endDate,
    );

    // 3. Obtener programa de lealtad del tenant
    const programs = await this.loyaltyProgramRepository.findByTenantId(request.tenantId);
    if (programs.length === 0) {
      // No hay programa, retornar vacío
      return new GetAdvancedRewardAnalyticsResponse(
        [],
        0,
        0,
        0,
        new PeriodDto(startDate.toISOString(), endDate.toISOString(), periodType),
      );
    }

    const program = programs[0]; // Primer programa

    // 4. Obtener reward rules activas del programa
    const allRules = await this.rewardRuleRepository.findActiveByProgramId(program.id);

    // Filtrar solo reglas de tipo PURCHASE que generan revenue
    const purchaseRules = allRules.filter((rule) => rule.trigger === 'PURCHASE').slice(0, 10); // Top 10

    if (purchaseRules.length === 0) {
      return new GetAdvancedRewardAnalyticsResponse(
        [],
        0,
        0,
        0,
        new PeriodDto(startDate.toISOString(), endDate.toISOString(), periodType),
      );
    }

    // 5. Para cada rule, calcular métricas en paralelo
    const rewardAnalytics = await Promise.all(
      purchaseRules.map(async (rule) => {
        const [revenueGenerated, topSegment, topBranch] = await Promise.all([
          this.pointsTransactionRepository.getRevenueByReward(
            rule.id,
            request.tenantId,
            startDate,
            endDate,
          ),
          this.pointsTransactionRepository.getTopSegmentByReward(
            rule.id,
            request.tenantId,
            startDate,
            endDate,
          ),
          this.pointsTransactionRepository.getTopBranchByReward(
            rule.id,
            request.tenantId,
            startDate,
            endDate,
          ),
        ]);

        // Estimación de redemptions y puntos
        // Aproximación: revenue / 10 = número de transacciones
        const estimatedRedemptions = Math.round(revenueGenerated / 10) || 1;
        const estimatedPointsPerTransaction = 50; // Placeholder
        const totalPointsRedeemed = estimatedRedemptions * estimatedPointsPerTransaction;

        // ROI: Comparar revenue vs costo de puntos
        const pointCost = 0.01; // $0.01 por punto
        const estimatedCost = totalPointsRedeemed * pointCost;
        const roi = estimatedCost > 0 ? (revenueGenerated / estimatedCost) * 100 : 0;

        // Efficiency: Revenue por punto
        const efficiency = totalPointsRedeemed > 0 ? revenueGenerated / totalPointsRedeemed : 0;

        return {
          ruleId: rule.id,
          rewardName: rule.name,
          redemptionsCount: estimatedRedemptions,
          pointsRedeemed: totalPointsRedeemed,
          revenueGenerated: Math.round(revenueGenerated * 100) / 100,
          roi: Math.round(roi * 100) / 100,
          efficiency: Math.round(efficiency * 100) / 100,
          topSegment: topSegment as CustomerSegment,
          topBranchId: topBranch?.branchId || 0,
          topBranchName: topBranch?.branchName || 'N/A',
          trend: 0, // TODO: Implementar comparación con período anterior
        };
      }),
    );

    // 6. Calcular totales
    const totalRedemptions = rewardAnalytics.reduce((sum, r) => sum + r.redemptionsCount, 0);
    const totalRevenueGenerated = rewardAnalytics.reduce((sum, r) => sum + r.revenueGenerated, 0);
    const avgROI =
      rewardAnalytics.length > 0
        ? rewardAnalytics.reduce((sum, r) => sum + r.roi, 0) / rewardAnalytics.length
        : 0;

    // 7. Ordenar por revenue generado
    rewardAnalytics.sort((a, b) => b.revenueGenerated - a.revenueGenerated);

    return new GetAdvancedRewardAnalyticsResponse(
      rewardAnalytics,
      totalRedemptions,
      Math.round(totalRevenueGenerated * 100) / 100,
      Math.round(avgROI * 100) / 100,
      new PeriodDto(startDate.toISOString(), endDate.toISOString(), periodType),
    );
  }

  /**
   * Calcula período de fechas
   */
  private calculatePeriod(
    period?: 'all' | 'month' | 'week' | 'custom',
    startDateStr?: string,
    endDateStr?: string,
  ): { startDate: Date; endDate: Date; periodType: 'all' | 'month' | 'week' | 'custom' } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    let periodType: 'all' | 'month' | 'week' | 'custom' = period || 'month';

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;

      case 'month':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;

      case 'custom':
        if (!startDateStr || !endDateStr) {
          throw new Error('startDate and endDate are required for custom period');
        }
        startDate = new Date(startDateStr);
        endDate = new Date(endDateStr);
        break;

      case 'all':
      default:
        startDate = new Date('2020-01-01');
        periodType = 'all';
        break;
    }

    return { startDate, endDate, periodType };
  }
}
