import { PartnerSubscriptionUsage } from '@libs/domain';
import { PartnerSubscriptionUsageEntity } from '../entities/partner-subscription-usage.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class PartnerSubscriptionUsageMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: PartnerSubscriptionUsageEntity): PartnerSubscriptionUsage {
    return new PartnerSubscriptionUsage(
      persistenceEntity.id,
      persistenceEntity.partnerSubscriptionId,
      persistenceEntity.tenantsCount,
      persistenceEntity.branchesCount,
      persistenceEntity.customersCount,
      persistenceEntity.rewardsCount,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   * Si el ID es 0, no se asigna para que la BD lo genere automáticamente
   */
  static toPersistence(domainEntity: PartnerSubscriptionUsage): PartnerSubscriptionUsageEntity {
    const entity = new PartnerSubscriptionUsageEntity();
    // Solo asignar ID si es mayor a 0 (uso existente)
    // Si es 0, la BD generará el ID automáticamente
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.partnerSubscriptionId = domainEntity.partnerSubscriptionId;
    entity.tenantsCount = domainEntity.tenantsCount;
    entity.branchesCount = domainEntity.branchesCount;
    entity.customersCount = domainEntity.customersCount;
    entity.rewardsCount = domainEntity.rewardsCount;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;
    return entity;
  }
}
