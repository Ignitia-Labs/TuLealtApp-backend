import { TierStatus } from '@libs/domain';
import { TierStatusEntity } from '@libs/infrastructure/entities/tier/tier-status.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class TierStatusMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: TierStatusEntity): TierStatus {
    return new TierStatus(
      persistenceEntity.membershipId,
      persistenceEntity.currentTierId,
      persistenceEntity.since,
      persistenceEntity.graceUntil,
      persistenceEntity.nextEvalAt,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: TierStatus): Partial<TierStatusEntity> {
    const entity = new TierStatusEntity();
    entity.membershipId = domainEntity.membershipId;
    entity.currentTierId = domainEntity.currentTierId;
    entity.since = domainEntity.since;
    entity.graceUntil = domainEntity.graceUntil;
    entity.nextEvalAt = domainEntity.nextEvalAt;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;
    return entity;
  }
}
