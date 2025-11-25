import { Module } from '@nestjs/common';
import { OrdersController } from './controllers/orders.controller';
import { InfrastructureModule } from '@libs/infrastructure';
import { HealthController } from '@libs/shared';
import { PartnerAuthModule } from './auth/partner-auth.module';

/**
 * Módulo principal de la Partner API
 * Configura todos los controladores y servicios necesarios
 */
@Module({
  imports: [InfrastructureModule, PartnerAuthModule],
  controllers: [OrdersController, HealthController],
  providers: [
    // Aquí se agregarían los handlers específicos de partner
    // Por ejemplo: GetOrdersByPartnerHandler, CreateProductHandler, etc.
  ],
})
export class PartnerApiModule {}
