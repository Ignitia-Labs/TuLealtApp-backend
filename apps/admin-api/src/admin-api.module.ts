import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { PricingController } from './controllers/pricing.controller';
import { RateExchangeController } from './controllers/rate-exchange.controller';
import { PartnersController } from './controllers/partners.controller';
import { TenantsController } from './controllers/tenants.controller';
import { BranchesController } from './controllers/branches.controller';
import { UploadController } from './controllers/upload.controller';
import { CurrenciesController } from './controllers/currencies.controller';
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
  CreatePartnerHandler,
  GetPartnerHandler,
  GetPartnersHandler,
  CreateTenantHandler,
  GetTenantHandler,
  CreateBranchHandler,
  GetBranchHandler,
  GetCurrenciesHandler,
} from '@libs/application';
import { InfrastructureModule, StorageModule } from '@libs/infrastructure';
import { HealthController } from '@libs/shared';
import { AdminAuthModule } from './auth/admin-auth.module';

/**
 * Módulo principal de la Admin API
 * Configura todos los controladores y servicios necesarios
 */
@Module({
  imports: [InfrastructureModule, StorageModule, AdminAuthModule],
  controllers: [
    UsersController,
    PricingController,
    RateExchangeController,
    PartnersController,
    TenantsController,
    BranchesController,
    UploadController,
    CurrenciesController,
    HealthController,
  ],
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
    // Handlers de aplicación - Partners
    CreatePartnerHandler,
    GetPartnerHandler,
    GetPartnersHandler,
    // Handlers de aplicación - Tenants
    CreateTenantHandler,
    GetTenantHandler,
    // Handlers de aplicación - Branches
    CreateBranchHandler,
    GetBranchHandler,
    // Handlers de aplicación - Currencies
    GetCurrenciesHandler,
  ],
})
export class AdminApiModule {}
