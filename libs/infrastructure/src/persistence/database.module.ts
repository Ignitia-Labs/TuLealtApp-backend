import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './database.config';
import { UserEntity } from './entities/user.entity';
import { PricingPlanEntity } from './entities/pricing-plan.entity';
import { PricingPeriodEntity } from './entities/pricing-period.entity';
import { PricingPromotionEntity } from './entities/pricing-promotion.entity';
import { PricingFeatureEntity } from './entities/pricing-feature.entity';
import { LegacyPromotionEntity } from './entities/legacy-promotion.entity';
import { RateExchangeEntity } from './entities/rate-exchange.entity';
import { PartnerEntity } from './entities/partner.entity';
import { PartnerSubscriptionEntity } from './entities/partner-subscription.entity';
import { PartnerSubscriptionUsageEntity } from './entities/partner-subscription-usage.entity';
import { PartnerLimitsEntity } from './entities/partner-limits.entity';
import { PartnerStatsEntity } from './entities/partner-stats.entity';
import { PricingPlanLimitsEntity } from './entities/pricing-plan-limits.entity';
import { TenantEntity } from './entities/tenant.entity';
import { TenantFeaturesEntity } from './entities/tenant-features.entity';
import { BranchEntity } from './entities/branch.entity';
import { CurrencyEntity } from './entities/currency.entity';
import { CountryEntity } from './entities/country.entity';
import { RewardEntity } from './entities/reward.entity';
import { RewardTierEntity } from './entities/reward-tier.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { PointsRuleEntity } from './entities/points-rule.entity';
import { CustomerTierEntity } from './entities/customer-tier.entity';
import { NotificationEntity } from './entities/notification.entity';
import { InvitationCodeEntity } from './entities/invitation-code.entity';
import { BillingCycleEntity } from './entities/billing-cycle.entity';
import { InvoiceEntity } from './entities/invoice.entity';
import { InvoiceItemEntity } from './entities/invoice-item.entity';
import { PaymentEntity } from './entities/payment.entity';
import { SavedPaymentMethodEntity } from './entities/saved-payment-method.entity';
import { SubscriptionEventEntity } from './entities/subscription-event.entity';
import { SubscriptionAlertEntity } from './entities/subscription-alert.entity';
import { CouponEntity } from './entities/coupon.entity';
import { PlanChangeEntity } from './entities/plan-change.entity';
import { PartnerRequestEntity } from './entities/partner-request.entity';
import { PartnerArchiveEntity } from './entities/partner-archive.entity';
import { CatalogEntity } from './entities/catalog.entity';
import { CustomerMembershipEntity } from './entities/customer-membership.entity';
import { UserRepository } from './repositories/user.repository';
import { PricingPlanRepository } from './repositories/pricing-plan.repository';
import { RateExchangeRepository } from './repositories/rate-exchange.repository';
import { PartnerRepository } from './repositories/partner.repository';
import { TenantRepository } from './repositories/tenant.repository';
import { BranchRepository } from './repositories/branch.repository';
import { CurrencyRepository } from './repositories/currency.repository';
import { CountryRepository } from './repositories/country.repository';
import { RewardRepository } from './repositories/reward.repository';
import { TransactionRepository } from './repositories/transaction.repository';
import { PointsRuleRepository } from './repositories/points-rule.repository';
import { CustomerTierRepository } from './repositories/customer-tier.repository';
import { NotificationRepository } from './repositories/notification.repository';
import { InvitationCodeRepository } from './repositories/invitation-code.repository';
import { BillingCycleRepository } from './repositories/billing-cycle.repository';
import { InvoiceRepository } from './repositories/invoice.repository';
import { PaymentRepository } from './repositories/payment.repository';
import { SavedPaymentMethodRepository } from './repositories/saved-payment-method.repository';
import { SubscriptionEventRepository } from './repositories/subscription-event.repository';
import { SubscriptionAlertRepository } from './repositories/subscription-alert.repository';
import { CouponRepository } from './repositories/coupon.repository';
import { PlanChangeRepository } from './repositories/plan-change.repository';
import { PartnerRequestRepository } from './repositories/partner-request.repository';
import { PartnerArchiveRepository } from './repositories/partner-archive.repository';
import { CatalogRepository } from './repositories/catalog.repository';
import { CustomerMembershipRepository } from './repositories/customer-membership.repository';
import {
  IUserRepository,
  IPricingPlanRepository,
  IRateExchangeRepository,
  IPartnerRepository,
  ITenantRepository,
  IBranchRepository,
  ICurrencyRepository,
  ICountryRepository,
  IRewardRepository,
  ITransactionRepository,
  IPointsRuleRepository,
  ICustomerTierRepository,
  INotificationRepository,
  IInvitationCodeRepository,
  IBillingCycleRepository,
  IInvoiceRepository,
  IPaymentRepository,
  ISavedPaymentMethodRepository,
  ISubscriptionEventRepository,
  ISubscriptionAlertRepository,
  ICouponRepository,
  IPlanChangeRepository,
  IPartnerRequestRepository,
  ICatalogRepository,
  ICustomerMembershipRepository,
} from '@libs/domain';

/**
 * Módulo de base de datos
 * Configura TypeORM y provee los repositorios
 */
@Module({
  imports: [
    TypeOrmModule.forRoot(getDatabaseConfig()),
    TypeOrmModule.forFeature([
      UserEntity,
      PricingPlanEntity,
      PricingPeriodEntity,
      PricingPromotionEntity,
      PricingFeatureEntity,
      LegacyPromotionEntity,
      RateExchangeEntity,
      PartnerEntity,
      PartnerSubscriptionEntity,
      PartnerSubscriptionUsageEntity,
      PartnerLimitsEntity,
      PartnerStatsEntity,
      PricingPlanLimitsEntity,
      TenantEntity,
      TenantFeaturesEntity,
      BranchEntity,
      CurrencyEntity,
      CountryEntity,
      RewardEntity,
      RewardTierEntity,
      CustomerTierEntity,
      TransactionEntity,
      PointsRuleEntity,
      CustomerTierEntity,
      NotificationEntity,
      InvitationCodeEntity,
      BillingCycleEntity,
      InvoiceEntity,
      InvoiceItemEntity,
      PaymentEntity,
      SavedPaymentMethodEntity,
      SubscriptionEventEntity,
      SubscriptionAlertEntity,
      CouponEntity,
      PlanChangeEntity,
      PartnerRequestEntity,
      PartnerArchiveEntity,
      CatalogEntity,
      CustomerMembershipEntity,
    ]),
  ],
  providers: [
    UserRepository,
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    PricingPlanRepository,
    {
      provide: 'IPricingPlanRepository',
      useClass: PricingPlanRepository,
    },
    RateExchangeRepository,
    {
      provide: 'IRateExchangeRepository',
      useClass: RateExchangeRepository,
    },
    PartnerRepository,
    {
      provide: 'IPartnerRepository',
      useClass: PartnerRepository,
    },
    TenantRepository,
    {
      provide: 'ITenantRepository',
      useClass: TenantRepository,
    },
    BranchRepository,
    {
      provide: 'IBranchRepository',
      useClass: BranchRepository,
    },
    CurrencyRepository,
    {
      provide: 'ICurrencyRepository',
      useClass: CurrencyRepository,
    },
    CountryRepository,
    {
      provide: 'ICountryRepository',
      useClass: CountryRepository,
    },
    RewardRepository,
    {
      provide: 'IRewardRepository',
      useClass: RewardRepository,
    },
    TransactionRepository,
    {
      provide: 'ITransactionRepository',
      useClass: TransactionRepository,
    },
    PointsRuleRepository,
    {
      provide: 'IPointsRuleRepository',
      useClass: PointsRuleRepository,
    },
    CustomerTierRepository,
    {
      provide: 'ICustomerTierRepository',
      useClass: CustomerTierRepository,
    },
    NotificationRepository,
    {
      provide: 'INotificationRepository',
      useClass: NotificationRepository,
    },
    InvitationCodeRepository,
    {
      provide: 'IInvitationCodeRepository',
      useClass: InvitationCodeRepository,
    },
    BillingCycleRepository,
    {
      provide: 'IBillingCycleRepository',
      useClass: BillingCycleRepository,
    },
    InvoiceRepository,
    {
      provide: 'IInvoiceRepository',
      useClass: InvoiceRepository,
    },
    PaymentRepository,
    {
      provide: 'IPaymentRepository',
      useClass: PaymentRepository,
    },
    SavedPaymentMethodRepository,
    {
      provide: 'ISavedPaymentMethodRepository',
      useClass: SavedPaymentMethodRepository,
    },
    SubscriptionEventRepository,
    {
      provide: 'ISubscriptionEventRepository',
      useClass: SubscriptionEventRepository,
    },
    SubscriptionAlertRepository,
    {
      provide: 'ISubscriptionAlertRepository',
      useClass: SubscriptionAlertRepository,
    },
    CouponRepository,
    {
      provide: 'ICouponRepository',
      useClass: CouponRepository,
    },
    PlanChangeRepository,
    {
      provide: 'IPlanChangeRepository',
      useClass: PlanChangeRepository,
    },
    PartnerRequestRepository,
    {
      provide: 'IPartnerRequestRepository',
      useClass: PartnerRequestRepository,
    },
    PartnerArchiveRepository,
    CatalogRepository,
    {
      provide: 'ICatalogRepository',
      useClass: CatalogRepository,
    },
    CustomerMembershipRepository,
    {
      provide: 'ICustomerMembershipRepository',
      useClass: CustomerMembershipRepository,
    },
  ],
  exports: [
    'IUserRepository',
    'IPricingPlanRepository',
    'IRateExchangeRepository',
    'IPartnerRepository',
    'ITenantRepository',
    'IBranchRepository',
    'ICurrencyRepository',
    'ICountryRepository',
    'IRewardRepository',
    'ITransactionRepository',
    'IPointsRuleRepository',
    'ICustomerTierRepository',
    'INotificationRepository',
    'IInvitationCodeRepository',
    'IBillingCycleRepository',
    'IInvoiceRepository',
    'IPaymentRepository',
    'ISavedPaymentMethodRepository',
    'ISubscriptionEventRepository',
    'ISubscriptionAlertRepository',
    'ICouponRepository',
    'IPlanChangeRepository',
    'IPartnerRequestRepository',
    'ICatalogRepository',
    'ICustomerMembershipRepository',
    UserRepository,
    PricingPlanRepository,
    RateExchangeRepository,
    PartnerRepository,
    TenantRepository,
    BranchRepository,
    CurrencyRepository,
    CountryRepository,
    RewardRepository,
    TransactionRepository,
    PointsRuleRepository,
    CustomerTierRepository,
    NotificationRepository,
    InvitationCodeRepository,
    BillingCycleRepository,
    InvoiceRepository,
    PaymentRepository,
    SavedPaymentMethodRepository,
    SubscriptionEventRepository,
    SubscriptionAlertRepository,
    CouponRepository,
    PlanChangeRepository,
    PartnerRequestRepository,
    PartnerArchiveRepository,
    CatalogRepository,
    CustomerMembershipRepository,
    TypeOrmModule,
  ],
})
export class DatabaseModule {}
