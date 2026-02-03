import { CustomerTier } from '@libs/domain';
import { CustomerTierEntity } from '@libs/infrastructure/entities/customer/customer-tier.entity';
import { CustomerTierBenefitEntity } from '@libs/infrastructure/entities/customer/customer-tier-benefit.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class CustomerTierMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   * Usa las tablas relacionadas como fuente de verdad
   */
  static toDomain(persistenceEntity: CustomerTierEntity): CustomerTier {
    // Construir benefits desde tabla relacionada
    const benefits: string[] =
      persistenceEntity.benefitsRelation?.length > 0
        ? persistenceEntity.benefitsRelation.map((b) => b.benefit)
        : [];

    return new CustomerTier(
      persistenceEntity.id,
      persistenceEntity.tenantId,
      persistenceEntity.name,
      persistenceEntity.description,
      persistenceEntity.minPoints,
      persistenceEntity.maxPoints,
      persistenceEntity.color,
      benefits,
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
   * Construye la relación benefitsRelation desde los benefits del dominio
   */
  static toPersistence(domainEntity: CustomerTier): Partial<CustomerTierEntity> {
    const entity: Partial<CustomerTierEntity> = {};

    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.tenantId = domainEntity.tenantId;
    entity.name = domainEntity.name;
    entity.description = domainEntity.description;
    entity.minPoints = domainEntity.minPoints;
    entity.maxPoints = domainEntity.maxPoints;
    entity.color = domainEntity.color;
    entity.multiplier = domainEntity.multiplier;
    entity.icon = domainEntity.icon;
    entity.priority = domainEntity.priority;
    entity.status = domainEntity.status;

    if (domainEntity.id > 0) {
      entity.createdAt = domainEntity.createdAt;
      entity.updatedAt = domainEntity.updatedAt;
    }

    // Construir benefitsRelation desde los benefits del dominio
    // TypeORM manejará el guardado mediante cascade: true
    if (domainEntity.benefits && domainEntity.benefits.length > 0) {
      const tierId = domainEntity.id || 0; // Usar 0 si es nuevo, TypeORM lo actualizará después
      entity.benefitsRelation = domainEntity.benefits.map((benefit) => {
        const benefitEntity = new CustomerTierBenefitEntity();
        benefitEntity.tierId = tierId;
        benefitEntity.benefit = benefit;
        return benefitEntity;
      });
    } else {
      entity.benefitsRelation = [];
    }

    return entity;
  }
}
