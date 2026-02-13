import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Importar todas las entidades explícitamente para que TypeORM CLI pueda resolverlas correctamente
import { UserEntity } from '@libs/infrastructure/entities/auth/user.entity';
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

// Cargar variables de entorno desde .env.local si existe (para desarrollo local)
if (process.env.NODE_ENV !== 'production') {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    dotenv.config({ path: envPath });
  } catch (error) {
    // Si no existe .env.local, usar variables de entorno del sistema
  }
}

/**
 * Configuración de DataSource para TypeORM CLI
 * Usado para ejecutar migraciones desde la línea de comandos
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'mariadb',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER || 'tulealtapp',
  password: process.env.DB_PASSWORD || 'tulealtapp',
  database: process.env.DB_NAME || 'tulealtapp',
  // Configurar timezone para que TypeORM use America/Guatemala
  // Esto asegura que @CreateDateColumn y @UpdateDateColumn usen el mismo timezone
  timezone: 'Z', // UTC - Las fechas se guardan en UTC y se convierten según TZ del sistema
  entities: [
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
  ],
  migrations: ['libs/infrastructure/src/persistence/migrations/**/*.ts'],
  synchronize: false, // Nunca usar synchronize en migraciones
  // Desactivar completamente el logging de TypeORM en producción
  logging: process.env.NODE_ENV === 'production' ? false : ['error', 'warn', 'schema', 'migration'],
  logger: process.env.NODE_ENV === 'production' ? undefined : 'advanced-console',
  migrationsTableName: 'migrations',
  migrationsRun: false,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
