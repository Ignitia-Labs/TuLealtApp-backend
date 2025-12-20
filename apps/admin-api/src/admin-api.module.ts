import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { PricingController } from './controllers/pricing.controller';
import { RateExchangeController } from './controllers/rate-exchange.controller';
import {
  CreateUserHandler,
  GetUserProfileHandler,
  LockUserHandler,
  UpdateUserProfileHandler,
  UpdateMyProfileHandler,
  GetPricingPlansHandler,
  GetPricingPlanByIdHandler,
  GetPricingPlanBySlugHandler,
  CalculatePriceHandler,
  CreatePricingPlanHandler,
  UpdatePricingPlanHandler,
  ToggleStatusPricingPlanHandler,
  DeletePricingPlanHandler,
  GetRateExchangeHandler,
  SetRateExchangeHandler,
} from '@libs/application';
import { InfrastructureModule } from '@libs/infrastructure';
import { HealthController } from '@libs/shared';
import { AdminAuthModule } from './auth/admin-auth.module';

/**
 * Módulo principal de la Admin API
 * Configura todos los controladores y servicios necesarios
 */
@Module({
  imports: [InfrastructureModule, AdminAuthModule],
  controllers: [UsersController, PricingController, RateExchangeController, HealthController],
  providers: [
    // Handlers de aplicación - Users
    CreateUserHandler,
    GetUserProfileHandler,
    LockUserHandler,
    UpdateUserProfileHandler,
    UpdateMyProfileHandler,
    // Handlers de aplicación - Pricing
    GetPricingPlansHandler,
    GetPricingPlanByIdHandler,
    GetPricingPlanBySlugHandler,
    CalculatePriceHandler,
    CreatePricingPlanHandler,
    UpdatePricingPlanHandler,
    ToggleStatusPricingPlanHandler,
    DeletePricingPlanHandler,
    GetRateExchangeHandler,
    SetRateExchangeHandler,
  ],
})
export class AdminApiModule {}
