import { TierPolicy } from '@libs/domain';
import { TierPolicyEntity } from '../entities/tier-policy.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class TierPolicyMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: TierPolicyEntity): TierPolicy {
    // Convertir Record<string, number> a TierThresholds (que es { [tierId: number]: number })
    const thresholds: { [tierId: number]: number } = {};
    for (const [key, value] of Object.entries(persistenceEntity.thresholds)) {
      thresholds[parseInt(key, 10)] = value;
    }

    return TierPolicy.create(
      persistenceEntity.tenantId,
      persistenceEntity.evaluationWindow,
      persistenceEntity.evaluationType,
      thresholds,
      persistenceEntity.gracePeriodDays,
      persistenceEntity.minTierDuration,
      persistenceEntity.downgradeStrategy,
      persistenceEntity.description,
      persistenceEntity.status,
      persistenceEntity.id,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: TierPolicy): Partial<TierPolicyEntity> {
    const entity = new TierPolicyEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.tenantId = domainEntity.tenantId;
    entity.evaluationWindow = domainEntity.evaluationWindow;
    entity.evaluationType = domainEntity.evaluationType;
    // Convertir TierThresholds a Record<string, number> para persistencia
    entity.thresholds = Object.fromEntries(
      Object.entries(domainEntity.thresholds).map(([key, value]) => [String(key), value]),
    );
    entity.gracePeriodDays = domainEntity.gracePeriodDays;
    entity.minTierDuration = domainEntity.minTierDuration;
    entity.downgradeStrategy = domainEntity.downgradeStrategy;
    entity.status = domainEntity.status;
    entity.description = domainEntity.description;
    if (domainEntity.id > 0) {
      entity.createdAt = domainEntity.createdAt;
      entity.updatedAt = domainEntity.updatedAt;
    }
    return entity;
  }
}
