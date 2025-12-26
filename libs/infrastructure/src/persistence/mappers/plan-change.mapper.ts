import { PlanChange } from '@libs/domain';
import { PlanChangeEntity } from '../entities/plan-change.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class PlanChangeMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: PlanChangeEntity): PlanChange {
    return new PlanChange(
      persistenceEntity.id,
      persistenceEntity.subscriptionId,
      persistenceEntity.partnerId,
      persistenceEntity.fromPlanId,
      persistenceEntity.fromPlanType,
      persistenceEntity.toPlanId,
      persistenceEntity.toPlanType,
      persistenceEntity.changeType,
      persistenceEntity.effectiveDate,
      persistenceEntity.proratedAmount,
      persistenceEntity.creditIssued,
      persistenceEntity.additionalCharge,
      persistenceEntity.currency,
      persistenceEntity.status,
      persistenceEntity.processedAt,
      persistenceEntity.reason,
      persistenceEntity.requestedBy,
      persistenceEntity.approvedBy,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: PlanChange): PlanChangeEntity {
    const entity = new PlanChangeEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.subscriptionId = domainEntity.subscriptionId;
    entity.partnerId = domainEntity.partnerId;
    entity.fromPlanId = domainEntity.fromPlanId;
    entity.fromPlanType = domainEntity.fromPlanType;
    entity.toPlanId = domainEntity.toPlanId;
    entity.toPlanType = domainEntity.toPlanType;
    entity.changeType = domainEntity.changeType;
    entity.effectiveDate = domainEntity.effectiveDate;
    entity.proratedAmount = domainEntity.proratedAmount;
    entity.creditIssued = domainEntity.creditIssued;
    entity.additionalCharge = domainEntity.additionalCharge;
    entity.currency = domainEntity.currency;
    entity.status = domainEntity.status;
    entity.processedAt = domainEntity.processedAt;
    entity.reason = domainEntity.reason;
    entity.requestedBy = domainEntity.requestedBy;
    entity.approvedBy = domainEntity.approvedBy;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;
    return entity;
  }
}
