/**
 * Infrastructure Layer - Public API
 * Exporta todas las implementaciones concretas de repositorios, mappers, etc.
 */

// Modules
export * from './infrastructure.module';
export * from './persistence/database.module';
export * from './storage/storage.module';
export * from './services/services.module';

// Entities - Auth
export * from './persistence/entities/auth/user.entity';
export * from './persistence/entities/auth/user-profile.entity';
export * from './persistence/entities/auth/user-permission.entity';
export * from './persistence/entities/auth/permission.entity';
export * from './persistence/entities/auth/profile.entity';
export * from './persistence/entities/auth/profile-permission.entity';
export * from './persistence/entities/auth/user-change-history.entity';
export * from './persistence/entities/auth/user-role.entity';
export * from './persistence/entities/auth/user-profile-data.entity';

// Entities - Billing
export * from './persistence/entities/billing/invoice.entity';
export * from './persistence/entities/billing/invoice-item.entity';
export * from './persistence/entities/billing/payment.entity';
export * from './persistence/entities/billing/billing-cycle.entity';
export * from './persistence/entities/billing/pricing-plan.entity';
export * from './persistence/entities/billing/pricing-plan-limits.entity';
export * from './persistence/entities/billing/pricing-period.entity';
export * from './persistence/entities/billing/pricing-promotion.entity';
export * from './persistence/entities/billing/pricing-feature.entity';
export * from './persistence/entities/billing/saved-payment-method.entity';
export * from './persistence/entities/billing/subscription-event.entity';
export * from './persistence/entities/billing/subscription-alert.entity';
export * from './persistence/entities/billing/coupon.entity';
export * from './persistence/entities/billing/plan-change.entity';
export * from './persistence/entities/billing/legacy-promotion.entity';

// Entities - Loyalty
export * from './persistence/entities/loyalty/loyalty-program.entity';
export * from './persistence/entities/loyalty/enrollment.entity';
export * from './persistence/entities/loyalty/points-transaction.entity';
export * from './persistence/entities/loyalty/reward-rule.entity';
export * from './persistence/entities/loyalty/reward-rule-eligibility.entity';
export * from './persistence/entities/loyalty/reward-rule-eligibility-membership-status.entity';
export * from './persistence/entities/loyalty/reward-rule-eligibility-flag.entity';
export * from './persistence/entities/loyalty/reward-rule-eligibility-category-id.entity';
export * from './persistence/entities/loyalty/reward-rule-eligibility-sku.entity';
export * from './persistence/entities/loyalty/reward-rule-points-formula.entity';
export * from './persistence/entities/loyalty/reward-rule-points-table-entry.entity';
export * from './persistence/entities/loyalty/reward-rule-points-formula-bonus.entity';
export * from './persistence/entities/loyalty/reward.entity';
export * from './persistence/entities/loyalty/redemption-code.entity';
export * from './persistence/entities/loyalty/loyalty-program-earning-domain.entity';

// Entities - Partner
export * from './persistence/entities/partner/partner.entity';
export * from './persistence/entities/partner/partner-subscription.entity';
export * from './persistence/entities/partner/partner-subscription-usage.entity';
export * from './persistence/entities/partner/partner-request.entity';
export * from './persistence/entities/partner/partner-archive.entity';
export * from './persistence/entities/partner/partner-staff-assignment.entity';
export * from './persistence/entities/partner/branch.entity';
export * from './persistence/entities/partner/catalog.entity';
export * from './persistence/entities/partner/commission.entity';
export * from './persistence/entities/partner/goal.entity';
export * from './persistence/entities/partner/partner-allowed-loyalty-program-type.entity';

// Entities - Customer
export * from './persistence/entities/customer/customer-membership.entity';
export * from './persistence/entities/customer/customer-tier.entity';
export * from './persistence/entities/customer/customer-tier-benefit.entity';
export * from './persistence/entities/customer/referral.entity';
export * from './persistence/entities/customer/invitation-code.entity';

// Entities - Communication
export * from './persistence/entities/communication/message-template.entity';
export * from './persistence/entities/communication/partner-message.entity';
export * from './persistence/entities/communication/message-recipient.entity';
export * from './persistence/entities/communication/message-filter.entity';
export * from './persistence/entities/communication/notification.entity';

// Entities - Tier
export * from './persistence/entities/tier/tier-policy.entity';
export * from './persistence/entities/tier/tier-status.entity';
export * from './persistence/entities/tier/tier-benefit.entity';
export * from './persistence/entities/tier/tier-benefit-exclusive-reward.entity';
export * from './persistence/entities/tier/tier-benefit-category-benefit.entity';
export * from './persistence/entities/tier/tier-benefit-category-exclusive-reward.entity';

// Entities - System
export * from './persistence/entities/system/tenant.entity';
export * from './persistence/entities/system/tenant-features.entity';
export * from './persistence/entities/system/tenant-analytics.entity';
export * from './persistence/entities/system/country.entity';
export * from './persistence/entities/system/currency.entity';
export * from './persistence/entities/system/rate-exchange.entity';

// Repositories - Auth
export * from './persistence/repositories/auth/user.repository';
export * from './persistence/repositories/auth/user-profile.repository';
export * from './persistence/repositories/auth/user-permission.repository';
export * from './persistence/repositories/auth/permission.repository';
export * from './persistence/repositories/auth/profile.repository';
export * from './persistence/repositories/auth/profile-permission.repository';
export * from './persistence/repositories/auth/user-change-history.repository';

// Repositories - Billing
export * from './persistence/repositories/billing/invoice.repository';
export * from './persistence/repositories/billing/payment.repository';
export * from './persistence/repositories/billing/billing-cycle.repository';
export * from './persistence/repositories/billing/pricing-plan.repository';
export * from './persistence/repositories/billing/saved-payment-method.repository';
export * from './persistence/repositories/billing/subscription-event.repository';
export * from './persistence/repositories/billing/subscription-alert.repository';
export * from './persistence/repositories/billing/coupon.repository';
export * from './persistence/repositories/billing/plan-change.repository';

// Repositories - Loyalty
export * from './persistence/repositories/loyalty/loyalty-program.repository';
export * from './persistence/repositories/loyalty/enrollment.repository';
export * from './persistence/repositories/loyalty/points-transaction.repository';
export * from './persistence/repositories/loyalty/reward-rule.repository';
export * from './persistence/repositories/loyalty/reward.repository';
export * from './persistence/repositories/loyalty/redemption-code.repository';

// Repositories - Partner
export * from './persistence/repositories/partner/partner.repository';
export * from './persistence/repositories/partner/partner-archive.repository';
export * from './persistence/repositories/partner/partner-request.repository';
export * from './persistence/repositories/partner/partner-staff-assignment.repository';
export * from './persistence/repositories/partner/branch.repository';
export * from './persistence/repositories/partner/catalog.repository';
export * from './persistence/repositories/partner/commission.repository';
export * from './persistence/repositories/partner/goal.repository';

// Repositories - Customer
export * from './persistence/repositories/customer/customer-membership.repository';
export * from './persistence/repositories/customer/customer-tier.repository';
export * from './persistence/repositories/customer/referral.repository';
export * from './persistence/repositories/customer/invitation-code.repository';

// Repositories - Communication
export * from './persistence/repositories/communication/message-template.repository';
export * from './persistence/repositories/communication/partner-message.repository';
export * from './persistence/repositories/communication/message-recipient.repository';
export * from './persistence/repositories/communication/message-filter.repository';
export * from './persistence/repositories/communication/notification.repository';

// Repositories - Tier
export * from './persistence/repositories/tier/tier-policy.repository';
export * from './persistence/repositories/tier/tier-status.repository';
export * from './persistence/repositories/tier/tier-benefit.repository';

// Repositories - System
export * from './persistence/repositories/system/tenant.repository';
export * from './persistence/repositories/system/tenant-analytics.repository';
export * from './persistence/repositories/system/country.repository';
export * from './persistence/repositories/system/currency.repository';
export * from './persistence/repositories/system/rate-exchange.repository';

// Mappers - Auth
export * from './persistence/mappers/auth/user.mapper';
export * from './persistence/mappers/auth/user-profile.mapper';
export * from './persistence/mappers/auth/user-permission.mapper';
export * from './persistence/mappers/auth/permission.mapper';
export * from './persistence/mappers/auth/profile.mapper';
export * from './persistence/mappers/auth/profile-permission.mapper';
export * from './persistence/mappers/auth/user-change-history.mapper';

// Mappers - Billing
export * from './persistence/mappers/billing/invoice.mapper';
export * from './persistence/mappers/billing/payment.mapper';
export * from './persistence/mappers/billing/billing-cycle.mapper';
export * from './persistence/mappers/billing/pricing-plan.mapper';
export * from './persistence/mappers/billing/pricing-plan-limits.mapper';
export * from './persistence/mappers/billing/saved-payment-method.mapper';
export * from './persistence/mappers/billing/subscription-event.mapper';
export * from './persistence/mappers/billing/subscription-alert.mapper';
export * from './persistence/mappers/billing/coupon.mapper';
export * from './persistence/mappers/billing/plan-change.mapper';

// Mappers - Loyalty
export * from './persistence/mappers/loyalty/loyalty-program.mapper';
export * from './persistence/mappers/loyalty/enrollment.mapper';
export * from './persistence/mappers/loyalty/points-transaction.mapper';
export * from './persistence/mappers/loyalty/reward-rule.mapper';
export * from './persistence/mappers/loyalty/reward.mapper';
export * from './persistence/mappers/loyalty/redemption-code.mapper';

// Mappers - Partner
export * from './persistence/mappers/partner/partner.mapper';
export * from './persistence/mappers/partner/partner-subscription-usage.mapper';
export * from './persistence/mappers/partner/partner-request.mapper';
export * from './persistence/mappers/partner/partner-staff-assignment.mapper';
export * from './persistence/mappers/partner/branch.mapper';
export * from './persistence/mappers/partner/catalog.mapper';
export * from './persistence/mappers/partner/commission.mapper';
export * from './persistence/mappers/partner/goal.mapper';

// Mappers - Customer
export * from './persistence/mappers/customer/customer-membership.mapper';
export * from './persistence/mappers/customer/customer-tier.mapper';
export * from './persistence/mappers/customer/referral.mapper';
export * from './persistence/mappers/customer/invitation-code.mapper';

// Mappers - Communication
export * from './persistence/mappers/communication/message-template.mapper';
export * from './persistence/mappers/communication/partner-message.mapper';
export * from './persistence/mappers/communication/message-recipient.mapper';
export * from './persistence/mappers/communication/message-filter.mapper';
export * from './persistence/mappers/communication/notification.mapper';

// Mappers - Tier
export * from './persistence/mappers/tier/tier-policy.mapper';
export * from './persistence/mappers/tier/tier-status.mapper';
export * from './persistence/mappers/tier/tier-benefit.mapper';

// Mappers - System
export * from './persistence/mappers/system/tenant.mapper';
export * from './persistence/mappers/system/tenant-analytics.mapper';
export * from './persistence/mappers/system/country.mapper';
export * from './persistence/mappers/system/currency.mapper';
export * from './persistence/mappers/system/rate-exchange.mapper';

// Storage Services
export * from './storage/s3.service';

// Infrastructure Services
export * from './services/invoice-pdf.service';
export * from './services/email.service';
export * from './services/payment-gateway.service';

// Seeds
export * from './seeds';
