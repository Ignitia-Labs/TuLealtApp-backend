import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IPointsTransactionRepository,
  IBranchRepository,
  ICustomerMembershipRepository,
  ITenantRepository,
} from '@libs/domain';
import { GetAllBranchesMetricsRequest } from './get-all-branches-metrics.request';
import {
  GetAllBranchesMetricsResponse,
  BranchMetricsDto,
} from './get-all-branches-metrics.response';
import { PeriodDto } from '../../loyalty/get-loyalty-dashboard/period-dto';

/**
 * Handler para obtener métricas de todas las sucursales de un tenant
 * Incluye métricas de revenue, clientes, y recompensas por sucursal
 */
@Injectable()
export class GetAllBranchesMetricsHandler {
  constructor(
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(request: GetAllBranchesMetricsRequest): Promise<GetAllBranchesMetricsResponse> {
    // 1. Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // 2. Calcular período de fechas
    const { startDate, endDate, periodType } = this.calculatePeriod(
      request.period,
      request.startDate,
      request.endDate,
    );

    // 3. Ejecutar todas las queries en paralelo para mejorar performance
    const [revenueMetrics, customerMetrics, redemptionMetrics, allBranches] = await Promise.all([
      this.pointsTransactionRepository.getBranchRevenueMetrics(
        request.tenantId,
        startDate,
        endDate,
      ),
      this.pointsTransactionRepository.getBranchCustomerMetrics(
        request.tenantId,
        startDate,
        endDate,
      ),
      this.pointsTransactionRepository.getBranchRedemptionMetrics(
        request.tenantId,
        startDate,
        endDate,
      ),
      this.branchRepository.findByTenantId(request.tenantId),
    ]);

    // 4. Crear mapas para acceso rápido O(1)
    const branchesMap = new Map(allBranches.map((b) => [b.id, b]));
    const revenueMap = new Map(revenueMetrics.map((r) => [r.branchId, r]));
    const customerMap = new Map(customerMetrics.map((c) => [c.branchId, c]));
    const redemptionMap = new Map(redemptionMetrics.map((r) => [r.branchId, r]));

    // 5. Construir métricas combinadas por sucursal
    const branchMetrics: BranchMetricsDto[] = allBranches.map((branch) => {
      const revenue = revenueMap.get(branch.id);
      const customers = customerMap.get(branch.id);
      const redemptions = redemptionMap.get(branch.id);

      const metrics = {
        branchId: branch.id,
        branchName: branch.name,
        totalCustomers: customers?.totalCustomers || 0,
        activeCustomers: customers?.activeCustomers || 0,
        totalRevenue: revenue?.totalRevenue || 0,
        transactionCount: revenue?.transactionCount || 0,
        avgTicket: revenue?.avgTicket || 0,
        rewardsRedeemed: redemptions?.rewardsRedeemed || 0,
        currency: revenue?.currency || 'GTQ',
        performanceScore: 0, // Calculado después
      };

      return metrics;
    });

    // 6. Calcular performance scores (requiere valores máximos)
    const maxRevenue = Math.max(...branchMetrics.map((b) => b.totalRevenue), 1);
    const maxCustomers = Math.max(...branchMetrics.map((b) => b.activeCustomers), 1);
    const maxRedemptions = Math.max(...branchMetrics.map((b) => b.rewardsRedeemed), 1);

    branchMetrics.forEach((branch) => {
      branch.performanceScore = this.calculatePerformanceScore(
        branch.totalRevenue,
        branch.activeCustomers,
        branch.rewardsRedeemed,
        maxRevenue,
        maxCustomers,
        maxRedemptions,
      );
    });

    // 7. Calcular totales agregados
    const totalTransactionCount = branchMetrics.reduce((sum, b) => sum + b.transactionCount, 0);
    const totals = {
      totalCustomers: branchMetrics.reduce((sum, b) => sum + b.totalCustomers, 0),
      totalActiveCustomers: branchMetrics.reduce((sum, b) => sum + b.activeCustomers, 0),
      totalRevenue: branchMetrics.reduce((sum, b) => sum + b.totalRevenue, 0),
      totalRewardsRedeemed: branchMetrics.reduce((sum, b) => sum + b.rewardsRedeemed, 0),
      avgTicket:
        totalTransactionCount > 0
          ? Math.round(
              (branchMetrics.reduce((sum, b) => sum + b.totalRevenue, 0) / totalTransactionCount) *
                100,
            ) / 100
          : 0,
    };

    // 8. Ordenar branches por performance score (descendente)
    branchMetrics.sort((a, b) => b.performanceScore - a.performanceScore);

    // 9. Construir respuesta
    return new GetAllBranchesMetricsResponse(
      branchMetrics,
      totals,
      new PeriodDto(startDate.toISOString(), endDate.toISOString(), periodType),
    );
  }

  /**
   * Calcula performance score de una sucursal (0-100)
   * Ponderación: Revenue 50%, Clientes 30%, Redemptions 20%
   */
  private calculatePerformanceScore(
    revenue: number,
    activeCustomers: number,
    redemptions: number,
    maxRevenue: number,
    maxCustomers: number,
    maxRedemptions: number,
  ): number {
    const revenueScore = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
    const customerScore = maxCustomers > 0 ? (activeCustomers / maxCustomers) * 100 : 0;
    const redemptionScore = maxRedemptions > 0 ? (redemptions / maxRedemptions) * 100 : 0;

    const weightedScore = revenueScore * 0.5 + customerScore * 0.3 + redemptionScore * 0.2;

    return Math.round(weightedScore * 100) / 100;
  }

  /**
   * Calcula las fechas de inicio y fin según el período solicitado
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
        // Últimos 7 días
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;

      case 'month':
        // Últimos 30 días
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;

      case 'custom':
        // Fechas personalizadas
        if (!startDateStr || !endDateStr) {
          throw new Error('startDate and endDate are required for custom period');
        }
        startDate = new Date(startDateStr);
        endDate = new Date(endDateStr);
        break;

      case 'all':
      default:
        // Todos los registros (desde 2020)
        startDate = new Date('2020-01-01');
        periodType = 'all';
        break;
    }

    return { startDate, endDate, periodType };
  }
}
