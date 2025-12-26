import { Reward } from '@libs/domain';
import { RewardEntity } from '../entities/reward.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class RewardMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: RewardEntity): Reward {
    return new Reward(
      persistenceEntity.id,
      persistenceEntity.tenantId,
      persistenceEntity.name,
      persistenceEntity.description,
      persistenceEntity.image,
      persistenceEntity.pointsRequired,
      persistenceEntity.stock,
      persistenceEntity.maxRedemptionsPerUser,
      persistenceEntity.status,
      persistenceEntity.category,
      persistenceEntity.terms,
      persistenceEntity.validUntil,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: Reward): RewardEntity {
    const entity = new RewardEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.tenantId = domainEntity.tenantId;
    entity.name = domainEntity.name;
    entity.description = domainEntity.description;
    entity.image = domainEntity.image;
    entity.pointsRequired = domainEntity.pointsRequired;
    entity.stock = domainEntity.stock;
    entity.maxRedemptionsPerUser = domainEntity.maxRedemptionsPerUser;
    entity.status = domainEntity.status;
    entity.category = domainEntity.category;
    entity.terms = domainEntity.terms;
    entity.validUntil = domainEntity.validUntil;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;
    return entity;
  }
}
