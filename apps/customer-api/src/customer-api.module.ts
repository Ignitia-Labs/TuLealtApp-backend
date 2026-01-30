import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@libs/infrastructure';
import { HealthController, LoggerModule } from '@libs/shared';
import { CustomerAuthModule } from './auth/customer-auth.module';
import { PricingController } from './controllers/pricing.controller';
import { CustomerMembershipsController } from './controllers/customer-memberships.controller';
import { CustomerPartnersController } from './controllers/customer-partners.controller';
import { CurrenciesController } from './controllers/currencies.controller';
import { InvitationCodesController } from './controllers/invitation-codes.controller';
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
  // Customer Loyalty Handlers
  GetPointsBalanceHandler,
  GetPointsTransactionsHandler,
  GetCustomerLoyaltyProgramsHandler,
  EnrollInProgramHandler,
  GetCurrentTierHandler,
  GetTierHistoryHandler,
  GetReferralCodeHandler,
  GetReferralsHandler,
  GetActivityHandler,
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
    CustomerPartnersController,
    CurrenciesController,
    InvitationCodesController,
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
    // Handlers de aplicación - Customer Loyalty
    GetPointsBalanceHandler,
    GetPointsTransactionsHandler,
    GetCustomerLoyaltyProgramsHandler,
    EnrollInProgramHandler,
    GetCurrentTierHandler,
    GetTierHistoryHandler,
    GetReferralCodeHandler,
    GetReferralsHandler,
    GetActivityHandler,
  ],
})
export class CustomerApiModule {}
