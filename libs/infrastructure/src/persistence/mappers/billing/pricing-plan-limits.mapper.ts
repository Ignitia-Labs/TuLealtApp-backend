import { PricingPlanLimits } from '@libs/domain';
import { PricingPlanLimitsEntity } from '@libs/infrastructure/entities/billing/pricing-plan-limits.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class PricingPlanLimitsMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: PricingPlanLimitsEntity): PricingPlanLimits {
    return new PricingPlanLimits(
      persistenceEntity.id,
      persistenceEntity.pricingPlanId,
      persistenceEntity.maxTenants,
      persistenceEntity.maxBranches,
      persistenceEntity.maxCustomers,
      persistenceEntity.maxRewards,
      persistenceEntity.maxAdmins,
      persistenceEntity.storageGB,
      persistenceEntity.apiCallsPerMonth,
      persistenceEntity.maxLoyaltyPrograms ?? -1,
      persistenceEntity.maxLoyaltyProgramsBase ?? -1,
      persistenceEntity.maxLoyaltyProgramsPromo ?? -1,
      persistenceEntity.maxLoyaltyProgramsPartner ?? -1,
      persistenceEntity.maxLoyaltyProgramsSubscription ?? -1,
      persistenceEntity.maxLoyaltyProgramsExperimental ?? -1,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   * Si el ID es 0, no se asigna para que la BD lo genere automáticamente
   */
  static toPersistence(domainEntity: PricingPlanLimits): PricingPlanLimitsEntity {
    const entity = new PricingPlanLimitsEntity();
    // Solo asignar ID si es mayor a 0 (límites existentes)
    // Si es 0, la BD generará el ID automáticamente
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.pricingPlanId = domainEntity.pricingPlanId;
    entity.maxTenants = domainEntity.maxTenants;
    entity.maxBranches = domainEntity.maxBranches;
    entity.maxCustomers = domainEntity.maxCustomers;
    entity.maxRewards = domainEntity.maxRewards;
    entity.maxAdmins = domainEntity.maxAdmins;
    entity.storageGB = domainEntity.storageGB;
    entity.apiCallsPerMonth = domainEntity.apiCallsPerMonth;
    entity.maxLoyaltyPrograms = domainEntity.maxLoyaltyPrograms;
    entity.maxLoyaltyProgramsBase = domainEntity.maxLoyaltyProgramsBase;
    entity.maxLoyaltyProgramsPromo = domainEntity.maxLoyaltyProgramsPromo;
    entity.maxLoyaltyProgramsPartner = domainEntity.maxLoyaltyProgramsPartner;
    entity.maxLoyaltyProgramsSubscription = domainEntity.maxLoyaltyProgramsSubscription;
    entity.maxLoyaltyProgramsExperimental = domainEntity.maxLoyaltyProgramsExperimental;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;
    return entity;
  }
}
