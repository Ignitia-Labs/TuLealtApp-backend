import { PointsRule } from '@libs/domain';
import { PointsRuleEntity } from '../entities/points-rule.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class PointsRuleMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: PointsRuleEntity): PointsRule {
    return new PointsRule(
      persistenceEntity.id,
      persistenceEntity.tenantId,
      persistenceEntity.name,
      persistenceEntity.description,
      persistenceEntity.type,
      persistenceEntity.pointsPerUnit,
      persistenceEntity.multiplier,
      persistenceEntity.minAmount,
      persistenceEntity.applicableDays,
      persistenceEntity.applicableHours,
      persistenceEntity.validFrom,
      persistenceEntity.validUntil,
      persistenceEntity.status,
      persistenceEntity.priority,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: PointsRule): PointsRuleEntity {
    const entity = new PointsRuleEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.tenantId = domainEntity.tenantId;
    entity.name = domainEntity.name;
    entity.description = domainEntity.description;
    entity.type = domainEntity.type;
    entity.pointsPerUnit = domainEntity.pointsPerUnit;
    entity.multiplier = domainEntity.multiplier;
    entity.minAmount = domainEntity.minAmount;
    entity.applicableDays = domainEntity.applicableDays;
    entity.applicableHours = domainEntity.applicableHours;
    entity.validFrom = domainEntity.validFrom;
    entity.validUntil = domainEntity.validUntil;
    entity.status = domainEntity.status;
    entity.priority = domainEntity.priority;
    if (domainEntity.id > 0) {
      entity.createdAt = domainEntity.createdAt;
      entity.updatedAt = domainEntity.updatedAt;
    }
    return entity;
  }
}
