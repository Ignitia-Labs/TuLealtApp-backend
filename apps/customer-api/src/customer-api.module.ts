import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@libs/infrastructure';
import { HealthController } from '@libs/shared';
import { CustomerAuthModule } from './auth/customer-auth.module';
import { PricingController } from './controllers/pricing.controller';
import { CustomerMembershipsController } from './controllers/customer-memberships.controller';
import { CustomerPartnersController } from './controllers/customer-partners.controller';
import { CurrenciesController } from './controllers/currencies.controller';
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
} from '@libs/application';

/**
 * Módulo principal de la Customer API
 * Configura todos los controladores y servicios necesarios
 */
@Module({
  imports: [InfrastructureModule, CustomerAuthModule],
  controllers: [
    PricingController,
    CustomerMembershipsController,
    CustomerPartnersController,
    CurrenciesController,
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
  ],
})
export class CustomerApiModule {}
