import { TenantAnalytics } from '@libs/domain/entities/system/tenant-analytics.entity';

/**
 * Interfaz del repositorio de TenantAnalytics
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface ITenantAnalyticsRepository {
  /**
   * Busca analytics por tenantId
   */
  findByTenantId(tenantId: number): Promise<TenantAnalytics | null>;

  /**
   * Guarda o actualiza analytics de un tenant
   * Si existe, actualiza; si no, crea uno nuevo
   */
  saveOrUpdate(
    tenantId: number,
    analytics: TenantAnalytics,
    metadata?: { calculationDurationMs?: number },
  ): Promise<TenantAnalytics>;

  /**
   * Elimina analytics de un tenant
   */
  delete(tenantId: number): Promise<void>;

  /**
   * Obtiene todos los tenants que necesitan actualización
   * (útil para cron jobs - tenants con analytics desactualizados)
   */
  findTenantsNeedingUpdate(olderThanHours: number): Promise<number[]>;
}
