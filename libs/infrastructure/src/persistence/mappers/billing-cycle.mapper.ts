import { BillingCycle } from '@libs/domain';
import { BillingCycleEntity } from '../entities/billing-cycle.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class BillingCycleMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: BillingCycleEntity): BillingCycle {
    return new BillingCycle(
      persistenceEntity.id,
      persistenceEntity.subscriptionId,
      persistenceEntity.partnerId,
      persistenceEntity.cycleNumber,
      persistenceEntity.startDate,
      persistenceEntity.endDate,
      persistenceEntity.durationDays,
      persistenceEntity.billingDate,
      persistenceEntity.dueDate,
      persistenceEntity.amount,
      persistenceEntity.paidAmount,
      persistenceEntity.currency,
      persistenceEntity.status,
      persistenceEntity.paymentStatus,
      persistenceEntity.paymentDate,
      persistenceEntity.paymentMethod,
      persistenceEntity.invoiceId,
      persistenceEntity.invoiceNumber,
      persistenceEntity.invoiceStatus,
      persistenceEntity.discountApplied,
      persistenceEntity.totalAmount,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: BillingCycle): BillingCycleEntity {
    const entity = new BillingCycleEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.subscriptionId = domainEntity.subscriptionId;
    entity.partnerId = domainEntity.partnerId;
    entity.cycleNumber = domainEntity.cycleNumber;
    entity.startDate = domainEntity.startDate;
    entity.endDate = domainEntity.endDate;
    entity.durationDays = domainEntity.durationDays;
    entity.billingDate = domainEntity.billingDate;
    entity.dueDate = domainEntity.dueDate;
    entity.amount = domainEntity.amount;
    entity.paidAmount = domainEntity.paidAmount;
    entity.currency = domainEntity.currency;
    entity.status = domainEntity.status;
    entity.paymentStatus = domainEntity.paymentStatus;
    entity.paymentDate = domainEntity.paymentDate;
    entity.paymentMethod = domainEntity.paymentMethod;
    entity.invoiceId = domainEntity.invoiceId;
    entity.invoiceNumber = domainEntity.invoiceNumber;
    entity.invoiceStatus = domainEntity.invoiceStatus;
    entity.discountApplied = domainEntity.discountApplied;
    entity.totalAmount = domainEntity.totalAmount;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;
    return entity;
  }
}
