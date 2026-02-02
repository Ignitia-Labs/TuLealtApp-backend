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
import { PricingPlanLimitsEntity } from './entities/pricing-plan-limits.entity';
import { TenantEntity } from './entities/tenant.entity';
import { TenantFeaturesEntity } from './entities/tenant-features.entity';
import { BranchEntity } from './entities/branch.entity';
import { CurrencyEntity } from './entities/currency.entity';
import { CountryEntity } from './entities/country.entity';
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
import { TenantAnalyticsEntity } from './entities/tenant-analytics.entity';
import { GoalEntity } from './entities/goal.entity';
import { PartnerStaffAssignmentEntity } from './entities/partner-staff-assignment.entity';
import { CommissionEntity } from './entities/commission.entity';
import { MessageTemplateEntity } from './entities/message-template.entity';
import { PartnerMessageEntity } from './entities/partner-message.entity';
import { MessageRecipientEntity } from './entities/message-recipient.entity';
import { MessageFilterEntity } from './entities/message-filter.entity';
import { ProfileEntity } from './entities/profile.entity';
import { UserProfileEntity } from './entities/user-profile.entity';
import { PermissionEntity } from './entities/permission.entity';
import { UserPermissionEntity } from './entities/user-permission.entity';
import { ProfilePermissionEntity } from './entities/profile-permission.entity';
import { UserChangeHistoryEntity } from './entities/user-change-history.entity';
import { PointsTransactionEntity } from './entities/points-transaction.entity';
import { LoyaltyProgramEntity } from './entities/loyalty-program.entity';
import { EnrollmentEntity } from './entities/enrollment.entity';
import { RewardRuleEntity } from './entities/reward-rule.entity';
import { RewardRuleEligibilityEntity } from './entities/reward-rule-eligibility.entity';
import { RewardRuleEligibilityMembershipStatusEntity } from './entities/reward-rule-eligibility-membership-status.entity';
import { RewardRuleEligibilityFlagEntity } from './entities/reward-rule-eligibility-flag.entity';
import { RewardRuleEligibilityCategoryIdEntity } from './entities/reward-rule-eligibility-category-id.entity';
import { RewardRuleEligibilitySkuEntity } from './entities/reward-rule-eligibility-sku.entity';
import { RewardRulePointsFormulaEntity } from './entities/reward-rule-points-formula.entity';
import { RewardRulePointsTableEntryEntity } from './entities/reward-rule-points-table-entry.entity';
import { RewardRulePointsFormulaBonusEntity } from './entities/reward-rule-points-formula-bonus.entity';
import { LoyaltyProgramEarningDomainEntity } from './entities/loyalty-program-earning-domain.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { UserProfileDataEntity } from './entities/user-profile-data.entity';
import { CustomerTierBenefitEntity } from './entities/customer-tier-benefit.entity';
import { TierBenefitExclusiveRewardEntity } from './entities/tier-benefit-exclusive-reward.entity';
import { TierBenefitCategoryBenefitEntity } from './entities/tier-benefit-category-benefit.entity';
import { TierBenefitCategoryExclusiveRewardEntity } from './entities/tier-benefit-category-exclusive-reward.entity';
import { TierPolicyEntity } from './entities/tier-policy.entity';
import { TierStatusEntity } from './entities/tier-status.entity';
import { TierBenefitEntity } from './entities/tier-benefit.entity';
import { ReferralEntity } from './entities/referral.entity';
import { RewardEntity } from './entities/reward.entity';
import { RedemptionCodeEntity } from './entities/redemption-code.entity';
import { UserRepository } from './repositories/user.repository';
import { PricingPlanRepository } from './repositories/pricing-plan.repository';
import { RateExchangeRepository } from './repositories/rate-exchange.repository';
import { PartnerRepository } from './repositories/partner.repository';
import { TenantRepository } from './repositories/tenant.repository';
import { BranchRepository } from './repositories/branch.repository';
import { CurrencyRepository } from './repositories/currency.repository';
import { CountryRepository } from './repositories/country.repository';
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
import { TenantAnalyticsRepository } from './repositories/tenant-analytics.repository';
import { GoalRepository } from './repositories/goal.repository';
import { PartnerStaffAssignmentRepository } from './repositories/partner-staff-assignment.repository';
import { CommissionRepository } from './repositories/commission.repository';
import { MessageTemplateRepository } from './repositories/message-template.repository';
import { PartnerMessageRepository } from './repositories/partner-message.repository';
import { MessageRecipientRepository } from './repositories/message-recipient.repository';
import { MessageFilterRepository } from './repositories/message-filter.repository';
import { ProfileRepository } from './repositories/profile.repository';
import { UserProfileRepository } from './repositories/user-profile.repository';
import { PermissionRepository } from './repositories/permission.repository';
import { UserPermissionRepository } from './repositories/user-permission.repository';
import { ProfilePermissionRepository } from './repositories/profile-permission.repository';
import { UserChangeHistoryRepository } from './repositories/user-change-history.repository';
import { PointsTransactionRepository } from './repositories/points-transaction.repository';
import { LoyaltyProgramRepository } from './repositories/loyalty-program.repository';
import { EnrollmentRepository } from './repositories/enrollment.repository';
import { RewardRuleRepository } from './repositories/reward-rule.repository';
import { TierPolicyRepository } from './repositories/tier-policy.repository';
import { TierStatusRepository } from './repositories/tier-status.repository';
import { TierBenefitRepository } from './repositories/tier-benefit.repository';
import { ReferralRepository } from './repositories/referral.repository';
import { RewardRepository } from './repositories/reward.repository';
import { RedemptionCodeRepository } from './repositories/redemption-code.repository';
import { CustomerMembershipSubscriber } from './subscribers/customer-membership.subscriber';
import {
  IUserRepository,
  IPricingPlanRepository,
  IRateExchangeRepository,
  IPartnerRepository,
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
    'IPricingPlanRepository',
    'IRateExchangeRepository',
    'IPartnerRepository',
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
    PricingPlanRepository,
    RateExchangeRepository,
    PartnerRepository,
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
