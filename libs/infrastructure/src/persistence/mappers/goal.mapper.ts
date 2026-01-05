import { Goal } from '@libs/domain';
import { GoalEntity } from '../entities/goal.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class GoalMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: GoalEntity): Goal {
    return new Goal(
      persistenceEntity.id,
      persistenceEntity.name,
      persistenceEntity.description,
      persistenceEntity.metric,
      persistenceEntity.targetValue,
      persistenceEntity.periodStart,
      persistenceEntity.periodEnd,
      persistenceEntity.isActive,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: Goal): GoalEntity {
    const entity = new GoalEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.name = domainEntity.name;
    entity.description = domainEntity.description;
    entity.metric = domainEntity.metric;
    entity.targetValue = domainEntity.targetValue;
    entity.periodStart = domainEntity.periodStart;
    entity.periodEnd = domainEntity.periodEnd;
    entity.isActive = domainEntity.isActive;
    if (domainEntity.id > 0) {
      entity.createdAt = domainEntity.createdAt;
      entity.updatedAt = domainEntity.updatedAt;
    }
    return entity;
  }
}
