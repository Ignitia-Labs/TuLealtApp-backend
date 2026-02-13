import { PartnerSubscription } from '@libs/domain';
import { PartnerSubscriptionEntity } from '@libs/infrastructure/entities/partner/partner-subscription.entity';

/**
 * Mapper para convertir entre PartnerSubscription de dominio y entidad de persistencia
 */
export class PartnerSubscriptionMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: PartnerSubscriptionEntity): PartnerSubscription {
    return new PartnerSubscription(
      persistenceEntity.id,
      persistenceEntity.partnerId,
      persistenceEntity.planId,
      persistenceEntity.planType as 'esencia' | 'conecta' | 'inspira',
      persistenceEntity.startDate,
      persistenceEntity.renewalDate,
      persistenceEntity.status as
        | 'active'
        | 'expired'
        | 'suspended'
        | 'cancelled'
        | 'trialing'
        | 'past_due'
        | 'paused',
      persistenceEntity.billingFrequency as 'monthly' | 'quarterly' | 'semiannual' | 'annual',
      persistenceEntity.billingAmount,
      persistenceEntity.includeTax,
      persistenceEntity.taxPercent,
      persistenceEntity.basePrice,
      persistenceEntity.taxAmount,
      persistenceEntity.totalPrice,
      persistenceEntity.currency,
      persistenceEntity.currencyId,
      persistenceEntity.nextBillingDate,
      persistenceEntity.nextBillingAmount,
      persistenceEntity.currentPeriodStart,
      persistenceEntity.currentPeriodEnd,
      persistenceEntity.trialEndDate,
      persistenceEntity.pausedAt,
      persistenceEntity.pauseReason,
      persistenceEntity.gracePeriodDays,
      persistenceEntity.retryAttempts,
      persistenceEntity.maxRetryAttempts,
      0, // creditBalance - se calcula dinámicamente, ver comentario en entidad
      persistenceEntity.discountPercent,
      persistenceEntity.discountCode,
      persistenceEntity.lastPaymentDate,
      persistenceEntity.lastPaymentAmount,
      persistenceEntity.paymentStatus as 'paid' | 'pending' | 'failed' | null,
      persistenceEntity.autoRenew,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: PartnerSubscription): PartnerSubscriptionEntity {
    const entity = new PartnerSubscriptionEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.partnerId = domainEntity.partnerId;
    entity.planId = domainEntity.planId;
    entity.planType = domainEntity.planType;
    entity.startDate = domainEntity.startDate;
    entity.renewalDate = domainEntity.renewalDate;
    entity.status = domainEntity.status;
    entity.billingFrequency = domainEntity.billingFrequency;
    entity.billingAmount = domainEntity.billingAmount;
    entity.includeTax = domainEntity.includeTax;
    entity.taxPercent = domainEntity.taxPercent;
    entity.basePrice = domainEntity.basePrice;
    entity.taxAmount = domainEntity.taxAmount;
    entity.totalPrice = domainEntity.totalPrice;
    entity.currency = domainEntity.currency;
    entity.currencyId = domainEntity.currencyId;
    entity.nextBillingDate = domainEntity.nextBillingDate;
    entity.nextBillingAmount = domainEntity.nextBillingAmount;
    entity.currentPeriodStart = domainEntity.currentPeriodStart;
    entity.currentPeriodEnd = domainEntity.currentPeriodEnd;
    entity.trialEndDate = domainEntity.trialEndDate;
    entity.pausedAt = domainEntity.pausedAt;
    entity.pauseReason = domainEntity.pauseReason;
    entity.gracePeriodDays = domainEntity.gracePeriodDays;
    entity.retryAttempts = domainEntity.retryAttempts;
    entity.maxRetryAttempts = domainEntity.maxRetryAttempts;
    // creditBalance no se guarda en la entidad - se calcula dinámicamente
    entity.discountPercent = domainEntity.discountPercent;
    entity.discountCode = domainEntity.discountCode;
    entity.lastPaymentDate = domainEntity.lastPaymentDate;
    entity.lastPaymentAmount = domainEntity.lastPaymentAmount;
    entity.paymentStatus = domainEntity.paymentStatus;
    entity.autoRenew = domainEntity.autoRenew;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;
    return entity;
  }
}
