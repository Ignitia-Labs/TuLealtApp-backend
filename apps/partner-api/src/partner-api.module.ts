import { Module } from '@nestjs/common';
import { PricingController } from './controllers/pricing.controller';
import { ProfilesController } from './controllers/profiles.controller';
import { UserProfilesController } from './controllers/user-profiles.controller';
import { PartnerUsersController } from './controllers/partner-users.controller';
import { UserPermissionsController } from './controllers/user-permissions.controller';
import { CatalogsController } from './controllers/catalogs.controller';
import { PartnersController } from './controllers/partners.controller';
import { PartnerCustomersController } from './controllers/partner-customers.controller';
import { TenantsController } from './controllers/tenants.controller';
import { BranchesController } from './controllers/branches.controller';
import { CurrenciesController } from './controllers/currencies.controller';
import { RateExchangeController } from './controllers/rate-exchange.controller';
import { PointsRulesController } from './controllers/points-rules.controller';
import { RewardsController } from './controllers/rewards.controller';
import { CustomerTiersController } from './controllers/customer-tiers.controller';
import { ContactInquiryController } from './controllers/contact-inquiry.controller';
import { PartnerRequestsController } from './controllers/partner-requests.controller';
import { TransactionsController } from './controllers/transactions.controller';
import { InfrastructureModule } from '@libs/infrastructure';
import { HealthController } from '@libs/shared';
import { PartnerAuthModule } from './auth/partner-auth.module';
import {
  GetPricingPlansHandler,
  GetPricingPlanByIdHandler,
  GetPricingPlanBySlugHandler,
  CalculatePriceHandler,
  PermissionService,
  // Profiles Handlers
  GetProfilesHandler,
  GetProfileHandler,
  CreateProfileHandler,
  UpdateProfileHandler,
  DeleteProfileHandler,
  // User Profiles Handlers
  AssignProfileToUserHandler,
  RemoveProfileFromUserHandler,
  GetUserProfilesHandler,
  // Users Handlers
  CreateUserHandler,
  // Partner Users Handlers
  CreatePartnerStaffUserHandler,
  GetPartnerUsersHandler,
  GetUserProfileHandler,
  UpdatePartnerUserAssignmentHandler,
  // User Permissions Handlers
  GetUserPermissionsHandler,
  // Catalogs Handlers
  GetCatalogsHandler,
  GetCatalogHandler,
  // Partners Handlers
  GetPartnerWithTenantsAndBranchesHandler,
  UpdatePartnerHandler,
  // Partner Customers Handlers
  GetPartnerCustomersHandler,
  CreateCustomerForPartnerHandler,
  CreateCustomerMembershipForPartnerHandler,
  GetCustomerByQrHandler,
  // Transactions Handlers
  EarnPointsHandler,
  RedeemPointsHandler,
  GetTransactionsHandler,
  // Tenants Handlers
  CreateTenantHandler,
  GetTenantHandler,
  GetTenantsByPartnerHandler,
  UpdateTenantHandler,
  DeleteTenantHandler,
  // Branches Handlers
  CreateBranchHandler,
  GetBranchHandler,
  GetBranchesByTenantHandler,
  UpdateBranchHandler,
  DeleteBranchHandler,
  // Currencies Handlers
  GetCurrenciesHandler,
  // Countries Handlers
  GetCountriesHandler,
  // Rate Exchange Handlers
  GetRateExchangeHandler,
  // Points Rules Handlers
  GetPointsRulesHandler,
  CreatePointsRuleHandler,
  UpdatePointsRuleHandler,
  DeletePointsRuleHandler,
  // Rewards Handlers
  GetRewardsHandler,
  GetRewardHandler,
  CreateRewardHandler,
  UpdateRewardHandler,
  DeleteRewardHandler,
  // Customer Tiers Handlers
  GetCustomerTiersHandler,
  GetCustomerTierHandler,
  CreateCustomerTierHandler,
  UpdateCustomerTierHandler,
  DeleteCustomerTierHandler,
  // Contact Inquiries Handlers
  CreateContactInquiryHandler,
  // Partner Requests Handlers
  CreatePartnerRequestHandler,
} from '@libs/application';

/**
 * Módulo principal de la Partner API
 * Configura todos los controladores y servicios necesarios
 */
@Module({
  imports: [InfrastructureModule, PartnerAuthModule],
  controllers: [
    PricingController,
    ProfilesController,
    UserProfilesController,
    PartnerUsersController,
    UserPermissionsController,
    CatalogsController,
    PartnersController,
    PartnerCustomersController,
    TenantsController,
    BranchesController,
    CurrenciesController,
    RateExchangeController,
    PointsRulesController,
    RewardsController,
    CustomerTiersController,
    ContactInquiryController,
    PartnerRequestsController,
    TransactionsController,
    HealthController,
  ],
  providers: [
    // Handlers de aplicación - Pricing
    GetPricingPlansHandler,
    GetPricingPlanByIdHandler,
    GetPricingPlanBySlugHandler,
    CalculatePriceHandler,
    // Permissions Service
    PermissionService,
    {
      provide: 'PermissionService',
      useExisting: PermissionService,
    },
    // Profiles Handlers
    GetProfilesHandler,
    GetProfileHandler,
    CreateProfileHandler,
    UpdateProfileHandler,
    DeleteProfileHandler,
    // User Profiles Handlers
    AssignProfileToUserHandler,
    RemoveProfileFromUserHandler,
    GetUserProfilesHandler,
    // Users Handlers
    CreateUserHandler,
    // Partner Users Handlers
    CreatePartnerStaffUserHandler,
    GetPartnerUsersHandler,
    GetUserProfileHandler,
    UpdatePartnerUserAssignmentHandler,
    // User Permissions Handlers
    GetUserPermissionsHandler,
    // Catalogs Handlers
    GetCatalogsHandler,
    GetCatalogHandler,
    // Partners Handlers
    GetPartnerWithTenantsAndBranchesHandler,
    UpdatePartnerHandler,
    // Partner Customers Handlers
    GetPartnerCustomersHandler,
    CreateCustomerForPartnerHandler,
    CreateCustomerMembershipForPartnerHandler,
    GetCustomerByQrHandler,
    // Transactions Handlers
    EarnPointsHandler,
    RedeemPointsHandler,
    GetTransactionsHandler,
    // Tenants Handlers
    CreateTenantHandler,
    GetTenantHandler,
    GetTenantsByPartnerHandler,
    UpdateTenantHandler,
    DeleteTenantHandler,
    // Branches Handlers
    CreateBranchHandler,
    GetBranchHandler,
    GetBranchesByTenantHandler,
    UpdateBranchHandler,
    DeleteBranchHandler,
    // Currencies Handlers
    GetCurrenciesHandler,
    // Countries Handlers
    GetCountriesHandler,
    // Rate Exchange Handlers
    GetRateExchangeHandler,
    // Points Rules Handlers
    GetPointsRulesHandler,
    CreatePointsRuleHandler,
    UpdatePointsRuleHandler,
    DeletePointsRuleHandler,
    // Rewards Handlers
    GetRewardsHandler,
    GetRewardHandler,
    CreateRewardHandler,
    UpdateRewardHandler,
    DeleteRewardHandler,
    // Customer Tiers Handlers
    GetCustomerTiersHandler,
    GetCustomerTierHandler,
    CreateCustomerTierHandler,
    UpdateCustomerTierHandler,
    DeleteCustomerTierHandler,
    // Contact Inquiries Handlers
    CreateContactInquiryHandler,
    // Partner Requests Handlers
    CreatePartnerRequestHandler,
  ],
})
export class PartnerApiModule {}
