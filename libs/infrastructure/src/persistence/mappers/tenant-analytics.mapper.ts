import { TenantAnalytics } from '@libs/domain';
import { TenantAnalyticsEntity } from '../entities/tenant-analytics.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class TenantAnalyticsMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: TenantAnalyticsEntity): TenantAnalytics {
    return new TenantAnalytics(
      persistenceEntity.tenantId,
      persistenceEntity.totalCustomers,
      persistenceEntity.activeCustomers,
      Number(persistenceEntity.totalPoints),
      Number(persistenceEntity.pointsEarned),
      Number(persistenceEntity.pointsRedeemed),
      persistenceEntity.totalRedemptions,
      Number(persistenceEntity.avgPointsPerCustomer),
      persistenceEntity.topRewards || [],
      persistenceEntity.topCustomers || [],
      persistenceEntity.recentTransactions || [],
      persistenceEntity.lastCalculatedAt,
      persistenceEntity.calculationDurationMs,
      persistenceEntity.version,
      persistenceEntity.id,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: TenantAnalytics): Partial<TenantAnalyticsEntity> {
    return {
      id: domainEntity.id && domainEntity.id > 0 ? domainEntity.id : undefined,
      tenantId: domainEntity.tenantId,
      totalCustomers: domainEntity.totalCustomers,
      activeCustomers: domainEntity.activeCustomers,
      totalPoints: domainEntity.totalPoints,
      pointsEarned: domainEntity.pointsEarned,
      pointsRedeemed: domainEntity.pointsRedeemed,
      totalRedemptions: domainEntity.totalRedemptions,
      avgPointsPerCustomer: domainEntity.avgPointsPerCustomer,
      topRewards: domainEntity.topRewards,
      topCustomers: domainEntity.topCustomers,
      recentTransactions: domainEntity.recentTransactions,
      lastCalculatedAt: domainEntity.lastCalculatedAt,
      calculationDurationMs: domainEntity.calculationDurationMs,
      version: domainEntity.version,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt,
    };
  }
}
