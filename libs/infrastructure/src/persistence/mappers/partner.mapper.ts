import { Partner, PartnerSubscription, PartnerLimits, PartnerStats } from '@libs/domain';
import { PartnerEntity } from '../entities/partner.entity';
import { PartnerSubscriptionEntity } from '../entities/partner-subscription.entity';
import { PartnerLimitsEntity } from '../entities/partner-limits.entity';
import { PartnerStatsEntity } from '../entities/partner-stats.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia de Partner
 */
export class PartnerMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(
    persistenceEntity: PartnerEntity,
    subscription?: PartnerSubscriptionEntity | null,
    limits?: PartnerLimitsEntity | null,
    stats?: PartnerStatsEntity | null,
  ): Partner {
    return Partner.create(
      persistenceEntity.name || '',
      persistenceEntity.responsibleName || '',
      persistenceEntity.email || '',
      persistenceEntity.phone || '',
      persistenceEntity.countryId || null,
      persistenceEntity.city || '',
      persistenceEntity.plan || '',
      persistenceEntity.category || '',
      persistenceEntity.rewardType || '',
      persistenceEntity.currencyId || 0,
      persistenceEntity.businessName || '',
      persistenceEntity.taxId || '',
      persistenceEntity.fiscalAddress || '',
      persistenceEntity.paymentMethod || '',
      persistenceEntity.billingEmail || '',
      persistenceEntity.domain || '',
      persistenceEntity.logo || null,
      persistenceEntity.banner || null,
      persistenceEntity.branchesNumber || 0,
      persistenceEntity.website || null,
      persistenceEntity.socialMedia || null,
      persistenceEntity.status || 'active',
      persistenceEntity.id,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   * @param domainEntity Entidad de dominio
   * @param countryName Nombre del país (opcional, se llena automáticamente desde countryId si se proporciona)
   */
  static toPersistence(domainEntity: Partner, countryName?: string | null): PartnerEntity {
    const entity = new PartnerEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.name = domainEntity.name;
    entity.responsibleName = domainEntity.responsibleName;
    entity.email = domainEntity.email;
    entity.phone = domainEntity.phone;
    entity.countryId = domainEntity.countryId;
    entity.country = countryName || null;
    entity.city = domainEntity.city;
    entity.plan = domainEntity.plan;
    entity.logo = domainEntity.logo;
    entity.banner = domainEntity.banner;
    entity.category = domainEntity.category;
    entity.branchesNumber = domainEntity.branchesNumber;
    entity.website = domainEntity.website;
    entity.socialMedia = domainEntity.socialMedia;
    entity.rewardType = domainEntity.rewardType;
    // currencyId es INTEGER tanto en dominio como en BD
    entity.currencyId = domainEntity.currencyId || 0;
    entity.businessName = domainEntity.businessName;
    entity.taxId = domainEntity.taxId;
    entity.fiscalAddress = domainEntity.fiscalAddress;
    entity.paymentMethod = domainEntity.paymentMethod;
    entity.billingEmail = domainEntity.billingEmail;
    entity.domain = domainEntity.domain;
    entity.status = domainEntity.status;
    if (domainEntity.id > 0) {
      entity.createdAt = domainEntity.createdAt;
      entity.updatedAt = domainEntity.updatedAt;
    }
    return entity;
  }

  /**
   * Convierte una entidad de persistencia de suscripción a entidad de dominio
   */
  static subscriptionToDomain(persistenceEntity: PartnerSubscriptionEntity): PartnerSubscription {
    // NOTA: creditBalance ya no se lee de la BD - se calcula dinámicamente desde los pagos
    // Usar siempre 0 como valor por defecto
    const creditBalance = 0;

    return PartnerSubscription.create(
      persistenceEntity.partnerId,
      persistenceEntity.planId,
      persistenceEntity.planType,
      persistenceEntity.startDate,
      persistenceEntity.renewalDate,
      persistenceEntity.billingFrequency,
      persistenceEntity.billingAmount,
      persistenceEntity.currency,
      persistenceEntity.currencyId ?? null,
      persistenceEntity.nextBillingDate,
      persistenceEntity.nextBillingAmount,
      persistenceEntity.currentPeriodStart,
      persistenceEntity.currentPeriodEnd,
      persistenceEntity.includeTax ?? false,
      persistenceEntity.taxPercent ?? null,
      persistenceEntity.basePrice,
      persistenceEntity.taxAmount,
      persistenceEntity.totalPrice,
      persistenceEntity.status,
      persistenceEntity.trialEndDate,
      persistenceEntity.pausedAt,
      persistenceEntity.pauseReason,
      persistenceEntity.gracePeriodDays,
      persistenceEntity.retryAttempts,
      persistenceEntity.maxRetryAttempts,
      creditBalance,
      persistenceEntity.discountPercent,
      persistenceEntity.discountCode,
      persistenceEntity.lastPaymentDate,
      persistenceEntity.lastPaymentAmount,
      persistenceEntity.paymentStatus,
      persistenceEntity.autoRenew,
      persistenceEntity.id,
    );
  }

  /**
   * Convierte una entidad de dominio de suscripción a entidad de persistencia
   */
  static subscriptionToPersistence(domainEntity: PartnerSubscription): PartnerSubscriptionEntity {
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
    entity.currencyId = domainEntity.currencyId ?? null;
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
    // NOTA: creditBalance fue eliminado - se calcula dinámicamente desde los pagos
    // Ver CreditBalanceService para el cálculo dinámico
    entity.discountPercent = domainEntity.discountPercent;
    entity.discountCode = domainEntity.discountCode;
    entity.lastPaymentDate = domainEntity.lastPaymentDate;
    entity.lastPaymentAmount = domainEntity.lastPaymentAmount;
    entity.paymentStatus = domainEntity.paymentStatus;
    entity.autoRenew = domainEntity.autoRenew;
    if (domainEntity.id > 0) {
      entity.createdAt = domainEntity.createdAt;
      entity.updatedAt = domainEntity.updatedAt;
    }
    return entity;
  }

  /**
   * Convierte una entidad de persistencia de límites a entidad de dominio
   */
  static limitsToDomain(persistenceEntity: PartnerLimitsEntity): PartnerLimits {
    return PartnerLimits.create(
      persistenceEntity.partnerId,
      persistenceEntity.maxTenants,
      persistenceEntity.maxBranches,
      persistenceEntity.maxCustomers,
      persistenceEntity.maxRewards,
      persistenceEntity.id,
    );
  }

  /**
   * Convierte una entidad de dominio de límites a entidad de persistencia
   */
  static limitsToPersistence(domainEntity: PartnerLimits): PartnerLimitsEntity {
    const entity = new PartnerLimitsEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.partnerId = domainEntity.partnerId;
    entity.maxTenants = domainEntity.maxTenants;
    entity.maxBranches = domainEntity.maxBranches;
    entity.maxCustomers = domainEntity.maxCustomers;
    entity.maxRewards = domainEntity.maxRewards;
    if (domainEntity.id > 0) {
      entity.createdAt = domainEntity.createdAt;
      entity.updatedAt = domainEntity.updatedAt;
    }
    return entity;
  }

  /**
   * Convierte una entidad de persistencia de estadísticas a entidad de dominio
   */
  static statsToDomain(persistenceEntity: PartnerStatsEntity): PartnerStats {
    return PartnerStats.create(
      persistenceEntity.partnerId,
      persistenceEntity.tenantsCount,
      persistenceEntity.branchesCount,
      persistenceEntity.customersCount,
      persistenceEntity.rewardsCount,
      persistenceEntity.id,
    );
  }

  /**
   * Convierte una entidad de dominio de estadísticas a entidad de persistencia
   */
  static statsToPersistence(domainEntity: PartnerStats): PartnerStatsEntity {
    const entity = new PartnerStatsEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.partnerId = domainEntity.partnerId;
    entity.tenantsCount = domainEntity.tenantsCount;
    entity.branchesCount = domainEntity.branchesCount;
    entity.customersCount = domainEntity.customersCount;
    entity.rewardsCount = domainEntity.rewardsCount;
    if (domainEntity.id > 0) {
      entity.createdAt = domainEntity.createdAt;
      entity.updatedAt = domainEntity.updatedAt;
    }
    return entity;
  }
}
