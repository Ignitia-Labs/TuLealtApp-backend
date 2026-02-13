import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './database.config';
import { UserEntity } from '@libs/infrastructure/entities/auth/user.entity';
import { RefreshTokenEntity } from '@libs/infrastructure/entities/auth/refresh-token.entity';
import { PricingPlanEntity } from '@libs/infrastructure/entities/billing/pricing-plan.entity';
import { PricingPeriodEntity } from '@libs/infrastructure/entities/billing/pricing-period.entity';
import { PricingPromotionEntity } from '@libs/infrastructure/entities/billing/pricing-promotion.entity';
import { PricingFeatureEntity } from '@libs/infrastructure/entities/billing/pricing-feature.entity';
import { LegacyPromotionEntity } from '@libs/infrastructure/entities/billing/legacy-promotion.entity';
import { RateExchangeEntity } from '@libs/infrastructure/entities/system/rate-exchange.entity';
import { PartnerEntity } from '@libs/infrastructure/entities/partner/partner.entity';
import { PartnerSubscriptionEntity } from '@libs/infrastructure/entities/partner/partner-subscription.entity';
import { PartnerSubscriptionUsageEntity } from '@libs/infrastructure/entities/partner/partner-subscription-usage.entity';
import { PricingPlanLimitsEntity } from '@libs/infrastructure/entities/billing/pricing-plan-limits.entity';
import { TenantEntity } from '@libs/infrastructure/entities/system/tenant.entity';
import { TenantFeaturesEntity } from '@libs/infrastructure/entities/system/tenant-features.entity';
import { BranchEntity } from '@libs/infrastructure/entities/partner/branch.entity';
import { CurrencyEntity } from '@libs/infrastructure/entities/system/currency.entity';
import { CountryEntity } from '@libs/infrastructure/entities/system/country.entity';
import { CustomerTierEntity } from '@libs/infrastructure/entities/customer/customer-tier.entity';
import { NotificationEntity } from '@libs/infrastructure/entities/communication/notification.entity';
import { InvitationCodeEntity } from '@libs/infrastructure/entities/customer/invitation-code.entity';
import { BillingCycleEntity } from '@libs/infrastructure/entities/billing/billing-cycle.entity';
import { InvoiceEntity } from '@libs/infrastructure/entities/billing/invoice.entity';
import { InvoiceItemEntity } from '@libs/infrastructure/entities/billing/invoice-item.entity';
import { PaymentEntity } from '@libs/infrastructure/entities/billing/payment.entity';
import { SavedPaymentMethodEntity } from '@libs/infrastructure/entities/billing/saved-payment-method.entity';
import { SubscriptionEventEntity } from '@libs/infrastructure/entities/billing/subscription-event.entity';
import { SubscriptionAlertEntity } from '@libs/infrastructure/entities/billing/subscription-alert.entity';
import { CouponEntity } from '@libs/infrastructure/entities/billing/coupon.entity';
import { PlanChangeEntity } from '@libs/infrastructure/entities/billing/plan-change.entity';
import { PartnerRequestEntity } from '@libs/infrastructure/entities/partner/partner-request.entity';
import { PartnerArchiveEntity } from '@libs/infrastructure/entities/partner/partner-archive.entity';
import { CatalogEntity } from '@libs/infrastructure/entities/partner/catalog.entity';
import { CustomerMembershipEntity } from '@libs/infrastructure/entities/customer/customer-membership.entity';
import { TenantAnalyticsEntity } from '@libs/infrastructure/entities/system/tenant-analytics.entity';
import { GoalEntity } from '@libs/infrastructure/entities/partner/goal.entity';
import { PartnerStaffAssignmentEntity } from '@libs/infrastructure/entities/partner/partner-staff-assignment.entity';
import { CommissionEntity } from '@libs/infrastructure/entities/partner/commission.entity';
import { MessageTemplateEntity } from '@libs/infrastructure/entities/communication/message-template.entity';
import { PartnerMessageEntity } from '@libs/infrastructure/entities/communication/partner-message.entity';
import { MessageRecipientEntity } from '@libs/infrastructure/entities/communication/message-recipient.entity';
import { MessageFilterEntity } from '@libs/infrastructure/entities/communication/message-filter.entity';
import { ProfileEntity } from '@libs/infrastructure/entities/auth/profile.entity';
import { UserProfileEntity } from '@libs/infrastructure/entities/auth/user-profile.entity';
import { PermissionEntity } from '@libs/infrastructure/entities/auth/permission.entity';
import { UserPermissionEntity } from '@libs/infrastructure/entities/auth/user-permission.entity';
import { ProfilePermissionEntity } from '@libs/infrastructure/entities/auth/profile-permission.entity';
import { UserChangeHistoryEntity } from '@libs/infrastructure/entities/auth/user-change-history.entity';
import { PointsTransactionEntity } from '@libs/infrastructure/entities/loyalty/points-transaction.entity';
import { LoyaltyProgramEntity } from '@libs/infrastructure/entities/loyalty/loyalty-program.entity';
import { EnrollmentEntity } from '@libs/infrastructure/entities/loyalty/enrollment.entity';
import { RewardRuleEntity } from '@libs/infrastructure/entities/loyalty/reward-rule.entity';
import { RewardRuleEligibilityEntity } from '@libs/infrastructure/entities/loyalty/reward-rule-eligibility.entity';
import { RewardRuleEligibilityMembershipStatusEntity } from '@libs/infrastructure/entities/loyalty/reward-rule-eligibility-membership-status.entity';
import { RewardRuleEligibilityFlagEntity } from '@libs/infrastructure/entities/loyalty/reward-rule-eligibility-flag.entity';
import { RewardRuleEligibilityCategoryIdEntity } from '@libs/infrastructure/entities/loyalty/reward-rule-eligibility-category-id.entity';
import { RewardRuleEligibilitySkuEntity } from '@libs/infrastructure/entities/loyalty/reward-rule-eligibility-sku.entity';
import { RewardRulePointsFormulaEntity } from '@libs/infrastructure/entities/loyalty/reward-rule-points-formula.entity';
import { RewardRulePointsTableEntryEntity } from '@libs/infrastructure/entities/loyalty/reward-rule-points-table-entry.entity';
import { RewardRulePointsFormulaBonusEntity } from '@libs/infrastructure/entities/loyalty/reward-rule-points-formula-bonus.entity';
import { LoyaltyProgramEarningDomainEntity } from '@libs/infrastructure/entities/loyalty/loyalty-program-earning-domain.entity';
import { UserRoleEntity } from '@libs/infrastructure/entities/auth/user-role.entity';
import { UserProfileDataEntity } from '@libs/infrastructure/entities/auth/user-profile-data.entity';
import { CustomerTierBenefitEntity } from '@libs/infrastructure/entities/customer/customer-tier-benefit.entity';
import { TierBenefitExclusiveRewardEntity } from '@libs/infrastructure/entities/tier/tier-benefit-exclusive-reward.entity';
import { TierBenefitCategoryBenefitEntity } from '@libs/infrastructure/entities/tier/tier-benefit-category-benefit.entity';
import { TierBenefitCategoryExclusiveRewardEntity } from '@libs/infrastructure/entities/tier/tier-benefit-category-exclusive-reward.entity';
import { TierPolicyEntity } from '@libs/infrastructure/entities/tier/tier-policy.entity';
import { TierStatusEntity } from '@libs/infrastructure/entities/tier/tier-status.entity';
import { TierBenefitEntity } from '@libs/infrastructure/entities/tier/tier-benefit.entity';
import { ReferralEntity } from '@libs/infrastructure/entities/customer/referral.entity';
import { RewardEntity } from '@libs/infrastructure/entities/loyalty/reward.entity';
import { RedemptionCodeEntity } from '@libs/infrastructure/entities/loyalty/redemption-code.entity';
import { UserRepository } from '@libs/infrastructure/repositories/auth/user.repository';
import { RefreshTokenRepository } from '@libs/infrastructure/repositories/auth/refresh-token.repository';
import { PricingPlanRepository } from '@libs/infrastructure/repositories/billing/pricing-plan.repository';
import { RateExchangeRepository } from '@libs/infrastructure/repositories/system/rate-exchange.repository';
import { PartnerRepository } from '@libs/infrastructure/repositories/partner/partner.repository';
import { PartnerSubscriptionRepository } from '@libs/infrastructure/repositories/partner/partner-subscription.repository';
import { TenantRepository } from '@libs/infrastructure/repositories/system/tenant.repository';
import { BranchRepository } from '@libs/infrastructure/repositories/partner/branch.repository';
import { CurrencyRepository } from '@libs/infrastructure/repositories/system/currency.repository';
import { CountryRepository } from '@libs/infrastructure/repositories/system/country.repository';
import { CustomerTierRepository } from '@libs/infrastructure/repositories/customer/customer-tier.repository';
import { NotificationRepository } from '@libs/infrastructure/repositories/communication/notification.repository';
import { InvitationCodeRepository } from '@libs/infrastructure/repositories/customer/invitation-code.repository';
import { BillingCycleRepository } from '@libs/infrastructure/repositories/billing/billing-cycle.repository';
import { InvoiceRepository } from '@libs/infrastructure/repositories/billing/invoice.repository';
import { PaymentRepository } from '@libs/infrastructure/repositories/billing/payment.repository';
import { SavedPaymentMethodRepository } from '@libs/infrastructure/repositories/billing/saved-payment-method.repository';
import { SubscriptionEventRepository } from '@libs/infrastructure/repositories/billing/subscription-event.repository';
import { SubscriptionAlertRepository } from '@libs/infrastructure/repositories/billing/subscription-alert.repository';
import { CouponRepository } from '@libs/infrastructure/repositories/billing/coupon.repository';
import { PlanChangeRepository } from '@libs/infrastructure/repositories/billing/plan-change.repository';
import { PartnerRequestRepository } from '@libs/infrastructure/repositories/partner/partner-request.repository';
import { PartnerArchiveRepository } from '@libs/infrastructure/repositories/partner/partner-archive.repository';
import { CatalogRepository } from '@libs/infrastructure/repositories/partner/catalog.repository';
import { CustomerMembershipRepository } from '@libs/infrastructure/repositories/customer/customer-membership.repository';
import { TenantAnalyticsRepository } from '@libs/infrastructure/repositories/system/tenant-analytics.repository';
import { GoalRepository } from '@libs/infrastructure/repositories/partner/goal.repository';
import { PartnerStaffAssignmentRepository } from '@libs/infrastructure/repositories/partner/partner-staff-assignment.repository';
import { CommissionRepository } from '@libs/infrastructure/repositories/partner/commission.repository';
import { MessageTemplateRepository } from '@libs/infrastructure/repositories/communication/message-template.repository';
import { PartnerMessageRepository } from '@libs/infrastructure/repositories/communication/partner-message.repository';
import { MessageRecipientRepository } from '@libs/infrastructure/repositories/communication/message-recipient.repository';
import { MessageFilterRepository } from '@libs/infrastructure/repositories/communication/message-filter.repository';
import { ProfileRepository } from '@libs/infrastructure/repositories/auth/profile.repository';
import { UserProfileRepository } from '@libs/infrastructure/repositories/auth/user-profile.repository';
import { PermissionRepository } from '@libs/infrastructure/repositories/auth/permission.repository';
import { UserPermissionRepository } from '@libs/infrastructure/repositories/auth/user-permission.repository';
import { ProfilePermissionRepository } from '@libs/infrastructure/repositories/auth/profile-permission.repository';
import { UserChangeHistoryRepository } from '@libs/infrastructure/repositories/auth/user-change-history.repository';
import { PointsTransactionRepository } from '@libs/infrastructure/repositories/loyalty/points-transaction.repository';
import { LoyaltyProgramRepository } from '@libs/infrastructure/repositories/loyalty/loyalty-program.repository';
import { EnrollmentRepository } from '@libs/infrastructure/repositories/loyalty/enrollment.repository';
import { RewardRuleRepository } from '@libs/infrastructure/repositories/loyalty/reward-rule.repository';
import { TierPolicyRepository } from '@libs/infrastructure/repositories/tier/tier-policy.repository';
import { TierStatusRepository } from '@libs/infrastructure/repositories/tier/tier-status.repository';
import { TierBenefitRepository } from '@libs/infrastructure/repositories/tier/tier-benefit.repository';
import { ReferralRepository } from '@libs/infrastructure/repositories/customer/referral.repository';
import { RewardRepository } from '@libs/infrastructure/repositories/loyalty/reward.repository';
import { RedemptionCodeRepository } from '@libs/infrastructure/repositories/loyalty/redemption-code.repository';
import { CustomerMembershipSubscriber } from './subscribers/customer-membership.subscriber';
import {
  IUserRepository,
  IRefreshTokenRepository,
  IPricingPlanRepository,
  IRateExchangeRepository,
  IPartnerRepository,
  IPartnerSubscriptionRepository,
  ITenantRepository,
  IBranchRepository,
  ICurrencyRepository,
  ICountryRepository,
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
  ITenantAnalyticsRepository,
  IGoalRepository,
  IPartnerStaffAssignmentRepository,
  ICommissionRepository,
  IMessageTemplateRepository,
  IPartnerMessageRepository,
  IMessageRecipientRepository,
  IMessageFilterRepository,
  IProfileRepository,
  IUserProfileRepository,
  IPermissionRepository,
  IUserPermissionRepository,
  IProfilePermissionRepository,
  IUserChangeHistoryRepository,
  IPointsTransactionRepository,
  ILoyaltyProgramRepository,
  IEnrollmentRepository,
  IRewardRuleRepository,
  ITierPolicyRepository,
  ITierStatusRepository,
  ITierBenefitRepository,
  IReferralRepository,
  IRewardRepository,
  IRedemptionCodeRepository,
} from '@libs/domain';

/**
 * Módulo de base de datos
 * Configura TypeORM y provee los repositorios
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const config = getDatabaseConfig();
        // Registrar subscribers después de crear la configuración
        // Esto evita dependencias circulares
        return {
          ...config,
          subscribers: [CustomerMembershipSubscriber],
        };
      },
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      RefreshTokenEntity,
      PricingPlanEntity,
      PricingPeriodEntity,
      PricingPromotionEntity,
      PricingFeatureEntity,
      LegacyPromotionEntity,
      RateExchangeEntity,
      PartnerEntity,
      PartnerSubscriptionEntity,
      PartnerSubscriptionUsageEntity,
      PricingPlanLimitsEntity,
      TenantEntity,
      TenantFeaturesEntity,
      BranchEntity,
      CurrencyEntity,
      CountryEntity,
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
      TenantAnalyticsEntity,
      GoalEntity,
      PartnerStaffAssignmentEntity,
      CommissionEntity,
      MessageTemplateEntity,
      PartnerMessageEntity,
      MessageRecipientEntity,
      MessageFilterEntity,
      ProfileEntity,
      UserProfileEntity,
      PermissionEntity,
      UserPermissionEntity,
      ProfilePermissionEntity,
      UserChangeHistoryEntity,
      PointsTransactionEntity,
      LoyaltyProgramEntity,
      EnrollmentEntity,
      RewardRuleEntity,
      RewardRuleEligibilityEntity,
      RewardRuleEligibilityMembershipStatusEntity,
      RewardRuleEligibilityFlagEntity,
      RewardRuleEligibilityCategoryIdEntity,
      RewardRuleEligibilitySkuEntity,
      RewardRulePointsFormulaEntity,
      RewardRulePointsTableEntryEntity,
      RewardRulePointsFormulaBonusEntity,
      LoyaltyProgramEarningDomainEntity,
      UserRoleEntity,
      UserProfileDataEntity,
      CustomerTierBenefitEntity,
      TierBenefitExclusiveRewardEntity,
      TierBenefitCategoryBenefitEntity,
      TierBenefitCategoryExclusiveRewardEntity,
      TierPolicyEntity,
      TierStatusEntity,
      TierBenefitEntity,
      ReferralEntity,
      RewardEntity,
      RedemptionCodeEntity,
    ]),
  ],
  providers: [
    UserRepository,
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    RefreshTokenRepository,
    {
      provide: 'IRefreshTokenRepository',
      useClass: RefreshTokenRepository,
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
    PartnerSubscriptionRepository,
    {
      provide: 'IPartnerSubscriptionRepository',
      useClass: PartnerSubscriptionRepository,
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
    TenantAnalyticsRepository,
    {
      provide: 'ITenantAnalyticsRepository',
      useClass: TenantAnalyticsRepository,
    },
    GoalRepository,
    {
      provide: 'IGoalRepository',
      useClass: GoalRepository,
    },
    PartnerStaffAssignmentRepository,
    {
      provide: 'IPartnerStaffAssignmentRepository',
      useClass: PartnerStaffAssignmentRepository,
    },
    CommissionRepository,
    {
      provide: 'ICommissionRepository',
      useClass: CommissionRepository,
    },
    MessageTemplateRepository,
    {
      provide: 'IMessageTemplateRepository',
      useClass: MessageTemplateRepository,
    },
    PartnerMessageRepository,
    {
      provide: 'IPartnerMessageRepository',
      useClass: PartnerMessageRepository,
    },
    MessageRecipientRepository,
    {
      provide: 'IMessageRecipientRepository',
      useClass: MessageRecipientRepository,
    },
    MessageFilterRepository,
    {
      provide: 'IMessageFilterRepository',
      useClass: MessageFilterRepository,
    },
    ProfileRepository,
    {
      provide: 'IProfileRepository',
      useClass: ProfileRepository,
    },
    UserProfileRepository,
    {
      provide: 'IUserProfileRepository',
      useClass: UserProfileRepository,
    },
    PermissionRepository,
    {
      provide: 'IPermissionRepository',
      useClass: PermissionRepository,
    },
    UserPermissionRepository,
    {
      provide: 'IUserPermissionRepository',
      useClass: UserPermissionRepository,
    },
    ProfilePermissionRepository,
    {
      provide: 'IProfilePermissionRepository',
      useClass: ProfilePermissionRepository,
    },
    UserChangeHistoryRepository,
    {
      provide: 'IUserChangeHistoryRepository',
      useClass: UserChangeHistoryRepository,
    },
    PointsTransactionRepository,
    {
      provide: 'IPointsTransactionRepository',
      useClass: PointsTransactionRepository,
    },
    LoyaltyProgramRepository,
    {
      provide: 'ILoyaltyProgramRepository',
      useClass: LoyaltyProgramRepository,
    },
    EnrollmentRepository,
    {
      provide: 'IEnrollmentRepository',
      useClass: EnrollmentRepository,
    },
    RewardRuleRepository,
    {
      provide: 'IRewardRuleRepository',
      useClass: RewardRuleRepository,
    },
    TierPolicyRepository,
    {
      provide: 'ITierPolicyRepository',
      useClass: TierPolicyRepository,
    },
    TierStatusRepository,
    {
      provide: 'ITierStatusRepository',
      useClass: TierStatusRepository,
    },
    TierBenefitRepository,
    {
      provide: 'ITierBenefitRepository',
      useClass: TierBenefitRepository,
    },
    ReferralRepository,
    {
      provide: 'IReferralRepository',
      useClass: ReferralRepository,
    },
    RewardRepository,
    {
      provide: 'IRewardRepository',
      useClass: RewardRepository,
    },
    RedemptionCodeRepository,
    {
      provide: 'IRedemptionCodeRepository',
      useClass: RedemptionCodeRepository,
    },
    // TypeORM Subscribers se registran en la configuración de TypeORM
    // para evitar dependencias circulares
  ],
  exports: [
    'IUserRepository',
    'IRefreshTokenRepository',
    'IPricingPlanRepository',
    'IRateExchangeRepository',
    'IPartnerRepository',
    'IPartnerSubscriptionRepository',
    'ITenantRepository',
    'IBranchRepository',
    'ICurrencyRepository',
    'ICountryRepository',
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
    'ITenantAnalyticsRepository',
    'IGoalRepository',
    'IPartnerStaffAssignmentRepository',
    'ICommissionRepository',
    'IMessageTemplateRepository',
    'IPartnerMessageRepository',
    'IMessageRecipientRepository',
    'IMessageFilterRepository',
    'IProfileRepository',
    'IUserProfileRepository',
    'IPermissionRepository',
    'IUserPermissionRepository',
    'IProfilePermissionRepository',
    'IUserChangeHistoryRepository',
    'IPointsTransactionRepository',
    'ILoyaltyProgramRepository',
    'IEnrollmentRepository',
    'IRewardRuleRepository',
    'ITierPolicyRepository',
    'ITierStatusRepository',
    'ITierBenefitRepository',
    'IReferralRepository',
    'IRewardRepository',
    'IRedemptionCodeRepository',
    UserRepository,
    RefreshTokenRepository,
    PricingPlanRepository,
    RateExchangeRepository,
    PartnerRepository,
    PartnerSubscriptionRepository,
    TenantRepository,
    BranchRepository,
    CurrencyRepository,
    CountryRepository,
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
    TenantAnalyticsRepository,
    GoalRepository,
    PartnerStaffAssignmentRepository,
    CommissionRepository,
    MessageTemplateRepository,
    PartnerMessageRepository,
    MessageRecipientRepository,
    MessageFilterRepository,
    ProfileRepository,
    UserProfileRepository,
    PermissionRepository,
    UserPermissionRepository,
    ProfilePermissionRepository,
    UserChangeHistoryRepository,
    PointsTransactionRepository,
    LoyaltyProgramRepository,
    EnrollmentRepository,
    RewardRuleRepository,
    TierPolicyRepository,
    TierStatusRepository,
    TierBenefitRepository,
    ReferralRepository,
    RewardRepository,
    RedemptionCodeRepository,
    TypeOrmModule,
  ],
})
export class DatabaseModule {}
