import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@libs/infrastructure';
import { HealthController } from '@libs/shared';
import { CustomerAuthModule } from './auth/customer-auth.module';
import { PricingController } from './controllers/pricing.controller';
import {
  GetPricingPlansHandler,
  GetPricingPlanByIdHandler,
  GetPricingPlanBySlugHandler,
  CalculatePriceHandler,
} from '@libs/application';

/**
 * Módulo principal de la Customer API
 * Configura todos los controladores y servicios necesarios
 */
@Module({
  imports: [InfrastructureModule, CustomerAuthModule],
  controllers: [PricingController, HealthController],
  providers: [
    // Handlers de aplicación - Pricing
    GetPricingPlansHandler,
    GetPricingPlanByIdHandler,
    GetPricingPlanBySlugHandler,
    CalculatePriceHandler,
  ],
})
export class CustomerApiModule {}
