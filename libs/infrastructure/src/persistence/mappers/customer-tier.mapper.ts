import { CustomerTier } from '@libs/domain';
import { CustomerTierEntity } from '../entities/customer-tier.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class CustomerTierMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: CustomerTierEntity): CustomerTier {
    return new CustomerTier(
      persistenceEntity.id,
      persistenceEntity.tenantId,
      persistenceEntity.name,
      persistenceEntity.description,
      persistenceEntity.minPoints,
      persistenceEntity.maxPoints,
      persistenceEntity.color,
      persistenceEntity.benefits,
      persistenceEntity.multiplier,
      persistenceEntity.icon,
      persistenceEntity.priority,
      persistenceEntity.status,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: CustomerTier): CustomerTierEntity {
    const entity = new CustomerTierEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.tenantId = domainEntity.tenantId;
    entity.name = domainEntity.name;
    entity.description = domainEntity.description;
    entity.minPoints = domainEntity.minPoints;
    entity.maxPoints = domainEntity.maxPoints;
    entity.color = domainEntity.color;
    entity.benefits = domainEntity.benefits;
    entity.multiplier = domainEntity.multiplier;
    entity.icon = domainEntity.icon;
    entity.priority = domainEntity.priority;
    entity.status = domainEntity.status;
    if (domainEntity.id > 0) {
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;
    }
    return entity;
  }
}
