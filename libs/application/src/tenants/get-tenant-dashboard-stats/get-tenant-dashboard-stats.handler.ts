import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ITenantRepository, ITenantAnalyticsRepository } from '@libs/domain';
import { TenantAnalyticsUpdaterService } from '../tenant-analytics-updater.service';
import { GetTenantDashboardStatsRequest } from './get-tenant-dashboard-stats.request';
import { GetTenantDashboardStatsResponse } from './get-tenant-dashboard-stats.response';

/**
 * Handler para obtener estadísticas del dashboard de un tenant
 */
@Injectable()
export class GetTenantDashboardStatsHandler {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('ITenantAnalyticsRepository')
    private readonly analyticsRepository: ITenantAnalyticsRepository,
    private readonly analyticsUpdaterService: TenantAnalyticsUpdaterService,
  ) {}

  async execute(request: GetTenantDashboardStatsRequest): Promise<GetTenantDashboardStatsResponse> {
    // Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Obtener analytics (si no existe, calcularlo)
    let analytics = await this.analyticsRepository.findByTenantId(request.tenantId);

    // Si no existe analytics o está muy desactualizado (>2 horas), calcularlo
    if (!analytics) {
      await this.analyticsUpdaterService.updateTenantAnalytics(request.tenantId);
      analytics = await this.analyticsRepository.findByTenantId(request.tenantId);
    } else {
      const hoursSinceUpdate =
        (Date.now() - analytics.lastCalculatedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceUpdate > 2) {
        // Actualizar en background (no esperar)
        this.analyticsUpdaterService.updateTenantAnalytics(request.tenantId).catch((error) => {
          console.error(`Error actualizando analytics del tenant ${request.tenantId}:`, error);
        });
      }
    }

    if (!analytics) {
      // Si aún no existe después de calcular, retornar valores por defecto
      return new GetTenantDashboardStatsResponse(
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        [],
        [],
        [],
        new Date(),
      );
    }

    return new GetTenantDashboardStatsResponse(
      analytics.totalCustomers,
      analytics.activeCustomers,
      analytics.totalPoints,
      analytics.pointsEarned,
      analytics.pointsRedeemed,
      analytics.totalRedemptions,
      analytics.avgPointsPerCustomer,
      analytics.topRewards,
      analytics.topCustomers,
      analytics.recentTransactions,
      analytics.lastCalculatedAt,
    );
  }
}
