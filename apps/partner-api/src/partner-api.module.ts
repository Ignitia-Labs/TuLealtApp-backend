import { Module } from '@nestjs/common';
import { OrdersController } from './controllers/orders.controller';
import { PricingController } from './controllers/pricing.controller';
import { InfrastructureModule } from '@libs/infrastructure';
import { HealthController } from '@libs/shared';
import { PartnerAuthModule } from './auth/partner-auth.module';
import {
  GetPricingPlansHandler,
  GetPricingPlanByIdHandler,
  GetPricingPlanBySlugHandler,
  CalculatePriceHandler,
} from '@libs/application';

/**
 * Módulo principal de la Partner API
 * Configura todos los controladores y servicios necesarios
 */
@Module({
  imports: [InfrastructureModule, PartnerAuthModule],
  controllers: [OrdersController, PricingController, HealthController],
  providers: [
    // Handlers de aplicación - Pricing
    GetPricingPlansHandler,
    GetPricingPlanByIdHandler,
    GetPricingPlanBySlugHandler,
    CalculatePriceHandler,
    // Aquí se agregarían los handlers específicos de partner
    // Por ejemplo: GetOrdersByPartnerHandler, CreateProductHandler, etc.
  ],
})
export class PartnerApiModule {}
