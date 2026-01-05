import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@libs/infrastructure';
import { HealthController } from '@libs/shared';
import { CustomerAuthModule } from './auth/customer-auth.module';
import { PricingController } from './controllers/pricing.controller';
import { CustomerMembershipsController } from './controllers/customer-memberships.controller';
import { CustomerPartnersController } from './controllers/customer-partners.controller';
import {
  GetPricingPlansHandler,
  GetPricingPlanByIdHandler,
  GetPricingPlanBySlugHandler,
  CalculatePriceHandler,
  GetCustomerMembershipsHandler,
  GetCustomerMembershipHandler,
  GetCustomerPartnersHandler,
  AssociateCustomerToPartnerHandler,
  UpdateCustomerPartnerStatusHandler,
  DissociateCustomerFromPartnerHandler,
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
    AssociateCustomerToPartnerHandler,
    UpdateCustomerPartnerStatusHandler,
    DissociateCustomerFromPartnerHandler,
  ],
})
export class CustomerApiModule {}
