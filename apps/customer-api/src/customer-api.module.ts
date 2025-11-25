import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@libs/infrastructure';
import { HealthController } from '@libs/shared';
import { CustomerAuthModule } from './auth/customer-auth.module';

/**
 * Módulo principal de la Customer API
 * Configura todos los controladores y servicios necesarios
 */
@Module({
  imports: [InfrastructureModule, CustomerAuthModule],
  controllers: [HealthController],
  providers: [],
})
export class CustomerApiModule {}
