import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { PricingController } from './controllers/pricing.controller';
import { RateExchangeController } from './controllers/rate-exchange.controller';
import { PartnersController } from './controllers/partners.controller';
import { TenantsController } from './controllers/tenants.controller';
import { BranchesController } from './controllers/branches.controller';
import { UploadController } from './controllers/upload.controller';
import { CurrenciesController } from './controllers/currencies.controller';
import { RewardsController } from './controllers/rewards.controller';
import { TransactionsController } from './controllers/transactions.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { PartnerRequestsController } from './controllers/partner-requests.controller';
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
  UpdatePartnerHandler,
  DeletePartnerHandler,
  CreateTenantHandler,
  GetTenantHandler,
  GetTenantsByPartnerHandler,
  UpdateTenantHandler,
  DeleteTenantHandler,
  CreateBranchHandler,
  GetBranchHandler,
  GetBranchesByTenantHandler,
  UpdateBranchHandler,
  DeleteBranchHandler,
  GetCurrenciesHandler,
  GetCountriesHandler,
  CreateRewardHandler,
  GetRewardsHandler,
  GetRewardHandler,
  GetTransactionsHandler,
  GetNotificationsHandler,
  MarkNotificationReadHandler,
  MarkAllNotificationsReadHandler,
  CreatePartnerRequestHandler,
  GetPartnerRequestHandler,
  GetPartnerRequestsHandler,
  UpdatePartnerRequestStatusHandler,
  AddPartnerRequestNotesHandler,
  RejectPartnerRequestHandler,
  ProcessPartnerRequestHandler,
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
    RewardsController,
    TransactionsController,
    NotificationsController,
    PartnerRequestsController,
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
    UpdatePartnerHandler,
    DeletePartnerHandler,
    // Handlers de aplicación - Tenants
    CreateTenantHandler,
    GetTenantHandler,
    GetTenantsByPartnerHandler,
    UpdateTenantHandler,
    DeleteTenantHandler,
    // Handlers de aplicación - Branches
    CreateBranchHandler,
    GetBranchHandler,
    GetBranchesByTenantHandler,
    UpdateBranchHandler,
    DeleteBranchHandler,
    // Handlers de aplicación - Currencies
    GetCurrenciesHandler,
    // Handlers de aplicación - Countries
    GetCountriesHandler,
    // Handlers de aplicación - Rewards
    CreateRewardHandler,
    GetRewardsHandler,
    GetRewardHandler,
    // Handlers de aplicación - Transactions
    GetTransactionsHandler,
    // Handlers de aplicación - Notifications
    GetNotificationsHandler,
    MarkNotificationReadHandler,
    MarkAllNotificationsReadHandler,
    // Handlers de aplicación - Partner Requests
    CreatePartnerRequestHandler,
    GetPartnerRequestHandler,
    GetPartnerRequestsHandler,
    UpdatePartnerRequestStatusHandler,
    AddPartnerRequestNotesHandler,
    RejectPartnerRequestHandler,
    ProcessPartnerRequestHandler,
  ],
})
export class AdminApiModule {}
