import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@libs/infrastructure';
import { HealthController } from '@libs/shared';
import { CustomerAuthModule } from './auth/customer-auth.module';
import { PricingController } from './controllers/pricing.controller';
import { CustomerMembershipsController } from './controllers/customer-memberships.controller';
import {
  GetPricingPlansHandler,
  GetPricingPlanByIdHandler,
  GetPricingPlanBySlugHandler,
  CalculatePriceHandler,
  GetCustomerMembershipsHandler,
  GetCustomerMembershipHandler,
} from '@libs/application';

/**
 * Módulo principal de la Customer API
 * Configura todos los controladores y servicios necesarios
 */
@Module({
  imports: [InfrastructureModule, CustomerAuthModule],
  controllers: [PricingController, CustomerMembershipsController, HealthController],
  providers: [
    // Handlers de aplicación - Pricing
    GetPricingPlansHandler,
    GetPricingPlanByIdHandler,
    GetPricingPlanBySlugHandler,
    CalculatePriceHandler,
    // Handlers de aplicación - Customer Memberships
    GetCustomerMembershipsHandler,
    GetCustomerMembershipHandler,
  ],
})
export class CustomerApiModule {}
