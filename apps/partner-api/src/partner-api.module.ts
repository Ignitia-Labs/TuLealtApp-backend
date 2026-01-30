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
import { CustomerTiersController } from './controllers/customer-tiers.controller';
import { ContactInquiryController } from './controllers/contact-inquiry.controller';
import { PartnerRequestsController } from './controllers/partner-requests.controller';
import { InvitationCodesController } from './controllers/invitation-codes.controller';
import { LoyaltyEventsController } from './controllers/loyalty-events.controller';
import { LoyaltyProgramsController } from './controllers/loyalty-programs.controller';
import { RewardRulesController } from './controllers/reward-rules.controller';
import { EnrollmentsController } from './controllers/enrollments.controller';
import { LoyaltyDashboardController } from './controllers/loyalty-dashboard.controller';
import { InfrastructureModule } from '@libs/infrastructure';
import { HealthController, LoggerModule } from '@libs/shared';
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
  GetCustomerMembershipHandler,
  UpdateCustomerMembershipHandler,
  DeleteCustomerMembershipHandler,
  GetCustomerPointsTransactionsHandler,
  // Tenants Handlers
  CreateTenantHandler,
  GetTenantHandler,
  GetTenantsByPartnerHandler,
  UpdateTenantHandler,
  DeleteTenantHandler,
  GetTenantDashboardStatsHandler,
  TenantAnalyticsUpdaterService,
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
  // Invitation Codes Handlers
  CreateInvitationCodeHandler,
  GetInvitationCodesHandler,
  GetInvitationCodeHandler,
  GetInvitationCodeByCodeHandler,
  UpdateInvitationCodeHandler,
  DeleteInvitationCodeHandler,
  UseInvitationCodeHandler,
  SendInvitationEmailHandler,
  ProcessLoyaltyEventHandler,
  // Loyalty Services
  EventNormalizer,
  MembershipResolver,
  ProgramCompatibilityResolver,
  RewardRuleEvaluator,
  ConflictResolver,
  IdempotencyKeyGenerator,
  BalanceSyncService,
  BalanceProjectionService,
  TierChangeService,
  TierEvaluationService,
  ReferralService,
  ExpirationCalculator,
  LoyaltyProgramConfigResolver,
  // Loyalty Programs Handlers
  GetLoyaltyProgramsHandler,
  GetLoyaltyProgramHandler,
  CreateLoyaltyProgramHandler,
  UpdateLoyaltyProgramHandler,
  DeleteLoyaltyProgramHandler,
  LoyaltyProgramValidator,
  // Reward Rules Handlers
  GetRewardRulesHandler,
  GetRewardRuleHandler,
  CreateRewardRuleHandler,
  UpdateRewardRuleHandler,
  DeleteRewardRuleHandler,
  RewardRuleValidator,
  // Enrollments Handlers
  GetEnrollmentsHandler,
  CreateEnrollmentHandler,
  DeleteEnrollmentHandler,
  // Loyalty Dashboard Handlers
  GetLoyaltyDashboardHandler,
  // Partner Customers Handlers
  CreatePointsAdjustmentHandler,
  CreatePointsReversalHandler,
  // Loyalty Services
  AdjustmentService,
  ReversalService,
} from '@libs/application';

/**
 * Módulo principal de la Partner API
 * Configura todos los controladores y servicios necesarios
 */
@Module({
  imports: [InfrastructureModule, PartnerAuthModule, LoggerModule],
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
    CustomerTiersController,
    ContactInquiryController,
    PartnerRequestsController,
    InvitationCodesController,
    LoyaltyEventsController,
    LoyaltyProgramsController,
    RewardRulesController,
    EnrollmentsController,
    LoyaltyDashboardController,
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
    GetCustomerMembershipHandler,
    UpdateCustomerMembershipHandler,
    DeleteCustomerMembershipHandler,
    GetCustomerPointsTransactionsHandler,
    CreatePointsAdjustmentHandler,
    CreatePointsReversalHandler,
    // Tenants Handlers
    CreateTenantHandler,
    GetTenantHandler,
    GetTenantsByPartnerHandler,
    UpdateTenantHandler,
    DeleteTenantHandler,
    GetTenantDashboardStatsHandler,
    TenantAnalyticsUpdaterService,
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
    // Invitation Codes Handlers
    CreateInvitationCodeHandler,
    GetInvitationCodesHandler,
    GetInvitationCodeHandler,
    GetInvitationCodeByCodeHandler,
    UpdateInvitationCodeHandler,
    DeleteInvitationCodeHandler,
    UseInvitationCodeHandler,
    SendInvitationEmailHandler,
    // Loyalty Events Handlers
    ProcessLoyaltyEventHandler,
    // Loyalty Services
    EventNormalizer,
    MembershipResolver,
    ProgramCompatibilityResolver,
    RewardRuleEvaluator,
    ConflictResolver,
    IdempotencyKeyGenerator,
    BalanceSyncService,
    BalanceProjectionService,
    TierChangeService,
    TierEvaluationService,
    ReferralService,
    ExpirationCalculator,
    LoyaltyProgramConfigResolver,
    AdjustmentService,
    ReversalService,
    // Loyalty Programs Handlers
    GetLoyaltyProgramsHandler,
    GetLoyaltyProgramHandler,
    CreateLoyaltyProgramHandler,
    UpdateLoyaltyProgramHandler,
    DeleteLoyaltyProgramHandler,
    LoyaltyProgramValidator,
    // Reward Rules Handlers
    GetRewardRulesHandler,
    GetRewardRuleHandler,
    CreateRewardRuleHandler,
    UpdateRewardRuleHandler,
    DeleteRewardRuleHandler,
    RewardRuleValidator,
    // Enrollments Handlers
    GetEnrollmentsHandler,
    CreateEnrollmentHandler,
    DeleteEnrollmentHandler,
    // Loyalty Dashboard Handlers
    GetLoyaltyDashboardHandler,
  ],
})
export class PartnerApiModule {}
