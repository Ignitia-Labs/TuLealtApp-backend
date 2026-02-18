import { Payment } from '@libs/domain';
import { PaymentEntity } from '@libs/infrastructure/entities/billing/payment.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class PaymentMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: PaymentEntity): Payment {
    return new Payment(
      persistenceEntity.id,
      persistenceEntity.subscriptionId,
      persistenceEntity.partnerId,
      persistenceEntity.invoiceId,
      persistenceEntity.billingCycleId,
      Number(persistenceEntity.amount), // Convertir DECIMAL a número
      persistenceEntity.currency,
      persistenceEntity.paymentMethod,
      persistenceEntity.status,
      persistenceEntity.paymentDate,
      persistenceEntity.processedDate,
      persistenceEntity.transactionId,
      persistenceEntity.reference,
      persistenceEntity.confirmationCode,
      persistenceEntity.gateway,
      persistenceEntity.gatewayTransactionId,
      persistenceEntity.cardLastFour,
      persistenceEntity.cardBrand,
      persistenceEntity.cardExpiry,
      persistenceEntity.isRetry,
      persistenceEntity.retryAttempt,
      persistenceEntity.notes,
      persistenceEntity.processedBy,
      persistenceEntity.originalPaymentId,
      persistenceEntity.isPartialPayment || false,
      persistenceEntity.validatedBy,
      persistenceEntity.validatedAt,
      persistenceEntity.rejectedBy,
      persistenceEntity.rejectedAt,
      persistenceEntity.rejectionReason,
      persistenceEntity.image ?? null,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: Payment): PaymentEntity {
    const entity = new PaymentEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.subscriptionId = domainEntity.subscriptionId;
    entity.partnerId = domainEntity.partnerId;
    entity.invoiceId = domainEntity.invoiceId;
    entity.billingCycleId = domainEntity.billingCycleId;
    entity.amount = domainEntity.amount;
    entity.currency = domainEntity.currency;
    entity.paymentMethod = domainEntity.paymentMethod;
    entity.status = domainEntity.status;
    entity.paymentDate = domainEntity.paymentDate;
    entity.processedDate = domainEntity.processedDate;
    entity.transactionId = domainEntity.transactionId;
    entity.reference = domainEntity.reference;
    entity.confirmationCode = domainEntity.confirmationCode;
    entity.gateway = domainEntity.gateway;
    entity.gatewayTransactionId = domainEntity.gatewayTransactionId;
    entity.cardLastFour = domainEntity.cardLastFour;
    entity.cardBrand = domainEntity.cardBrand;
    entity.cardExpiry = domainEntity.cardExpiry;
    entity.isRetry = domainEntity.isRetry;
    entity.retryAttempt = domainEntity.retryAttempt;
    entity.notes = domainEntity.notes;
    entity.processedBy = domainEntity.processedBy;
    entity.originalPaymentId = domainEntity.originalPaymentId;
    entity.isPartialPayment = domainEntity.isPartialPayment;
    entity.validatedBy = domainEntity.validatedBy;
    entity.validatedAt = domainEntity.validatedAt;
    entity.rejectedBy = domainEntity.rejectedBy;
    entity.rejectedAt = domainEntity.rejectedAt;
    entity.rejectionReason = domainEntity.rejectionReason;
    entity.image = domainEntity.image;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;
    return entity;
  }
}
