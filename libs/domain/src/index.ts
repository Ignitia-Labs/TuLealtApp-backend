/**
 * Domain Layer - Public API
 * Exporta todas las entidades, interfaces y tipos del dominio
 */

// Entities - Auth
export * from './entities/auth/user.entity';
export * from './entities/auth/refresh-token.entity';
export * from './entities/auth/user-profile.entity';
export * from './entities/auth/user-permission.entity';
export * from './entities/auth/permission.entity';
export * from './entities/auth/profile.entity';
export * from './entities/auth/profile-permission.entity';
export * from './entities/auth/user-change-history.entity';

// Entities - Billing
export * from './entities/billing/invoice.entity';
export * from './entities/billing/payment.entity';
export * from './entities/billing/billing-cycle.entity';
export * from './entities/billing/pricing-plan.entity';
export * from './entities/billing/pricing-plan-limits.entity';
export * from './entities/billing/saved-payment-method.entity';
export * from './entities/billing/subscription-event.entity';
export * from './entities/billing/subscription-alert.entity';
export * from './entities/billing/coupon.entity';
export * from './entities/billing/plan-change.entity';

// Entities - Loyalty
export * from './entities/loyalty/loyalty-program.entity';
export * from './entities/loyalty/enrollment.entity';
export * from './entities/loyalty/points-transaction.entity';
export * from './entities/loyalty/reward-rule.entity';
export * from './entities/loyalty/reward.entity';
export * from './entities/loyalty/redemption-code.entity';

// Entities - Partner
export * from './entities/partner/partner.entity';
export * from './entities/partner/partner-subscription.entity';
export * from './entities/partner/partner-subscription-usage.entity';
export * from './entities/partner/partner-request.entity';
export * from './entities/partner/branch.entity';
export * from './entities/partner/catalog.entity';
export * from './entities/partner/goal.entity';
export * from './entities/partner/partner-staff-assignment.entity';
export * from './entities/partner/commission.entity';

// Entities - Customer
export * from './entities/customer/customer-membership.entity';
export * from './entities/customer/customer-tier.entity';
export * from './entities/customer/referral.entity';
export * from './entities/customer/invitation-code.entity';

// Entities - Communication
export * from './entities/communication/message-template.entity';
export * from './entities/communication/partner-message.entity';
export * from './entities/communication/message-recipient.entity';
export * from './entities/communication/message-filter.entity';
export * from './entities/communication/notification.entity';

// Entities - Tier
export * from './entities/tier/tier-policy.entity';
export * from './entities/tier/tier-status.entity';
export * from './entities/tier/tier-benefit.entity';

// Entities - System
export * from './entities/system/tenant.entity';
export * from './entities/system/tenant-features.entity';
export * from './entities/system/tenant-analytics.entity';
export * from './entities/system/country.entity';
export * from './entities/system/currency.entity';
export * from './entities/system/rate-exchange.entity';
export * from './constants/earning-domains';
export * from './constants/conflict-groups';
export * from './events/loyalty-event.types';

// Repository Interfaces - Auth
export * from './repositories/auth/user.repository.interface';
export * from './repositories/auth/refresh-token.repository.interface';
export * from './repositories/auth/user-profile.repository.interface';
export * from './repositories/auth/user-permission.repository.interface';
export * from './repositories/auth/permission.repository.interface';
export * from './repositories/auth/profile.repository.interface';
export * from './repositories/auth/profile-permission.repository.interface';
export * from './repositories/auth/user-change-history.repository.interface';

// Repository Interfaces - Billing
export * from './repositories/billing/invoice.repository.interface';
export * from './repositories/billing/payment.repository.interface';
export * from './repositories/billing/billing-cycle.repository.interface';
export * from './repositories/billing/pricing-plan.repository.interface';
export * from './repositories/billing/saved-payment-method.repository.interface';
export * from './repositories/billing/subscription-event.repository.interface';
export * from './repositories/billing/subscription-alert.repository.interface';
export * from './repositories/billing/coupon.repository.interface';
export * from './repositories/billing/plan-change.repository.interface';

// Repository Interfaces - Loyalty
export * from './repositories/loyalty/loyalty-program.repository.interface';
export * from './repositories/loyalty/enrollment.repository.interface';
export * from './repositories/loyalty/points-transaction.repository.interface';
export * from './repositories/loyalty/reward-rule.repository.interface';
export * from './repositories/loyalty/reward.repository.interface';
export * from './repositories/loyalty/redemption-code.repository.interface';

// Repository Interfaces - Partner
export * from './repositories/partner/partner.repository.interface';
export * from './repositories/partner/partner-request.repository.interface';
export * from './repositories/partner/partner-staff-assignment.repository.interface';
export * from './repositories/partner/branch.repository.interface';
export * from './repositories/partner/catalog.repository.interface';
export * from './repositories/partner/commission.repository.interface';
export * from './repositories/partner/goal.repository.interface';

// Repository Interfaces - Customer
export * from './repositories/customer/customer-membership.repository.interface';
export * from './repositories/customer/customer-tier.repository.interface';
export * from './repositories/customer/referral.repository.interface';
export * from './repositories/customer/invitation-code.repository.interface';

// Repository Interfaces - Communication
export * from './repositories/communication/message-template.repository.interface';
export * from './repositories/communication/partner-message.repository.interface';
export * from './repositories/communication/message-recipient.repository.interface';
export * from './repositories/communication/message-filter.repository.interface';
export * from './repositories/communication/notification.repository.interface';

// Repository Interfaces - Tier
export * from './repositories/tier/tier-policy.repository.interface';
export * from './repositories/tier/tier-status.repository.interface';
export * from './repositories/tier/tier-benefit.repository.interface';

// Repository Interfaces - System
export * from './repositories/system/tenant.repository.interface';
export * from './repositories/system/tenant-analytics.repository.interface';
export * from './repositories/system/country.repository.interface';
export * from './repositories/system/currency.repository.interface';
export * from './repositories/system/rate-exchange.repository.interface';
