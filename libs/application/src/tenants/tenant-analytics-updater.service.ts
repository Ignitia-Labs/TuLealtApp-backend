import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ITenantRepository,
  ITenantAnalyticsRepository,
  ICustomerMembershipRepository,
  ITransactionRepository,
  IRewardRepository,
  TenantAnalytics,
} from '@libs/domain';

/**
 * Servicio para actualizar automáticamente las estadísticas de analytics de tenants
 * Se ejecuta cada hora mediante un cron job
 */
@Injectable()
export class TenantAnalyticsUpdaterService {
  private readonly logger = new Logger(TenantAnalyticsUpdaterService.name);

  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('ITenantAnalyticsRepository')
    private readonly analyticsRepository: ITenantAnalyticsRepository,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
    @Inject('IRewardRepository')
    private readonly rewardRepository: IRewardRepository,
  ) {}

  /**
   * Cron job que se ejecuta cada hora
   * Actualiza analytics de todos los tenants activos
   */
  @Cron('0 * * * *') // Cada hora en el minuto 0
  async handleHourlyAnalyticsUpdate() {
    this.logger.log('Iniciando actualización automática de analytics de tenants...');
    const overallStartTime = Date.now();

    try {
      const tenants = await this.tenantRepository.findAllActive();
      this.logger.log(`Encontrados ${tenants.length} tenants activos para actualizar`);

      if (tenants.length === 0) {
        this.logger.log('No hay tenants activos para actualizar');
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: Array<{ tenantId: number; error: string }> = [];

      // Procesar tenants secuencialmente para evitar sobrecarga de la base de datos
      for (const tenant of tenants) {
        try {
          await this.updateTenantAnalytics(tenant.id);
          successCount++;
        } catch (error) {
          errorCount++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push({ tenantId: tenant.id, error: errorMessage });

          this.logger.error(
            `Error actualizando analytics del tenant ${tenant.id}: ${errorMessage}`,
          );

          // Continuar con el siguiente tenant aunque haya error
        }
      }

      const overallDuration = Date.now() - overallStartTime;
      this.logger.log(
        `Actualización completada en ${overallDuration}ms: ${successCount} exitosas, ${errorCount} errores`,
      );

      if (errors.length > 0) {
        this.logger.warn(
          `Tenants con errores: ${errors.map((e) => `ID ${e.tenantId}`).join(', ')}`,
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error crítico en actualización automática de analytics: ${errorMessage}`,
        error,
      );
    }
  }

  /**
   * Actualiza analytics de un tenant específico
   * Maneja correctamente INSERT y UPDATE según si el registro existe o no
   */
  async updateTenantAnalytics(tenantId: number): Promise<void> {
    const startTime = Date.now();

    try {
      // Calcular todas las métricas
      const analytics = await this.calculateTenantAnalytics(tenantId);

      // Guardar o actualizar en la tabla
      // El repositorio maneja automáticamente si debe hacer INSERT o UPDATE
      await this.analyticsRepository.saveOrUpdate(tenantId, analytics, {
        calculationDurationMs: Date.now() - startTime,
      });

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Analytics del tenant ${tenantId} actualizado exitosamente en ${duration}ms`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error actualizando analytics del tenant ${tenantId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Calcula todas las métricas de analytics para un tenant
   */
  private async calculateTenantAnalytics(tenantId: number): Promise<TenantAnalytics> {
    // 1. Métricas de Customers
    const totalCustomers = await this.membershipRepository.countByTenantId(tenantId);
    const activeCustomers = await this.membershipRepository.countByTenantIdAndStatus(
      tenantId,
      'active',
    );

    // 2. Métricas de Puntos
    const memberships = await this.membershipRepository.findByTenantId(tenantId);
    const totalPoints = memberships.reduce((sum, m) => sum + m.points, 0);

    // 3. Métricas de Transacciones (usando queries optimizadas)
    const transactionStats = await this.transactionRepository.getStatsByTenantId(tenantId);
    const pointsEarned = transactionStats.pointsEarned;
    const pointsRedeemed = transactionStats.pointsRedeemed;
    const totalRedemptions = transactionStats.totalRedemptions;

    const avgPointsPerCustomer = TenantAnalytics.calculateAvgPointsPerCustomer(
      totalPoints,
      totalCustomers,
    );

    // 4. Top Rewards (por número de redemptions)
    const topRewards = await this.rewardRepository.getTopRewardsByTenantId(tenantId, 10);

    // 5. Top Customers (por puntos totales)
    const topCustomers = await this.membershipRepository.getTopCustomersByTenantId(tenantId, 10);

    // 6. Recent Transactions (últimas 20)
    const recentTransactions = await this.transactionRepository.getRecentTransactionsByTenantId(
      tenantId,
      20,
    );

    return TenantAnalytics.create(
      tenantId,
      totalCustomers,
      activeCustomers,
      totalPoints,
      pointsEarned,
      pointsRedeemed,
      totalRedemptions,
      avgPointsPerCustomer,
      topRewards,
      topCustomers,
      recentTransactions,
    );
  }
}
