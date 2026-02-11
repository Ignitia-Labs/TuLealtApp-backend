import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@libs/infrastructure';
import { HealthController, LoggerModule } from '@libs/shared';
import { CustomerAuthModule } from './auth/customer-auth.module';
import { PricingController } from './controllers/pricing.controller';
import { CustomerMembershipsController } from './controllers/customer-memberships.controller';
import { RewardsController } from './controllers/rewards.controller';
import { CurrenciesController } from './controllers/currencies.controller';
import { InvitationCodesController } from './controllers/invitation-codes.controller';
import { CatalogsController } from './controllers/catalogs.controller';
import {
  GetPricingPlansHandler,
  GetPricingPlanByIdHandler,
  GetPricingPlanBySlugHandler,
  CalculatePriceHandler,
  GetCustomerMembershipsHandler,
  GetCustomerMembershipHandler,
  GetCustomerPartnersHandler,
  GetCurrenciesHandler,
  GetCountriesHandler,
  ValidateInvitationCodeHandler,
  // Catalog Handlers
  GetCatalogsHandler,
  // Customer Loyalty Handlers
  GetPointsBalanceHandler,
  GetPointsTransactionsHandler,
  GetCustomerLoyaltyProgramsHandler,
  GetMembershipEnrollmentsHandler,
  GetUserEnrollmentsHandler,
  EnrollInProgramHandler,
  UnenrollFromProgramHandler,
  GetCurrentTierHandler,
  GetTierHistoryHandler,
  GetReferralCodeHandler,
  GetReferralsHandler,
  GetActivityHandler,
  // Rewards Handlers
  GetAvailableRewardsHandler,
  RedeemRewardHandler,
  GetCustomerRedemptionCodesHandler,
  RedeemRewardCodeGeneratorService,
  // Loyalty Services
  BalanceProjectionService,
  BalanceSyncService,
  LoyaltyProgramConfigResolver,
} from '@libs/application';

/**
 * Módulo principal de la Customer API
 * Configura todos los controladores y servicios necesarios
 */
@Module({
  imports: [InfrastructureModule, CustomerAuthModule, LoggerModule],
  controllers: [
    PricingController,
    CustomerMembershipsController,
    RewardsController,
    CurrenciesController,
    InvitationCodesController,
    CatalogsController,
    HealthController,
  ],
  providers: [
    // Handlers de aplicación - Pricing
    GetPricingPlansHandler,
    GetPricingPlanByIdHandler,
    GetPricingPlanBySlugHandler,
    CalculatePriceHandler,
    // Handlers de aplicación - Customer Memberships
    GetCustomerMembershipsHandler,
    GetCustomerMembershipHandler,
    // Handlers de aplicación - Customer Partners
    GetCustomerPartnersHandler,
    // Handlers de aplicación - Currencies & Countries
    GetCurrenciesHandler,
    GetCountriesHandler,
    // Handlers de aplicación - Invitation Codes
    ValidateInvitationCodeHandler,
    // Handlers de aplicación - Catalogs
    GetCatalogsHandler,
    // Handlers de aplicación - Customer Loyalty
    GetPointsBalanceHandler,
    GetPointsTransactionsHandler,
    GetCustomerLoyaltyProgramsHandler,
    GetMembershipEnrollmentsHandler,
    GetUserEnrollmentsHandler,
    EnrollInProgramHandler,
    UnenrollFromProgramHandler,
    GetCurrentTierHandler,
    GetTierHistoryHandler,
    GetReferralCodeHandler,
    GetReferralsHandler,
    GetActivityHandler,
    // Rewards Handlers
    GetAvailableRewardsHandler,
    RedeemRewardHandler,
    GetCustomerRedemptionCodesHandler,
    RedeemRewardCodeGeneratorService,
    // Loyalty Services
    BalanceProjectionService,
    BalanceSyncService,
    LoyaltyProgramConfigResolver,
  ],
})
export class CustomerApiModule {}
