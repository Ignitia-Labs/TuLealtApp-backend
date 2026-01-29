import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersController } from './controllers/users.controller';
import { PricingController } from './controllers/pricing.controller';
import { RateExchangeController } from './controllers/rate-exchange.controller';
import { PartnersController } from './controllers/partners.controller';
import { TenantsController } from './controllers/tenants.controller';
import { BranchesController } from './controllers/branches.controller';
import { UploadController } from './controllers/upload.controller';
import { CurrenciesController } from './controllers/currencies.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { PartnerRequestsController } from './controllers/partner-requests.controller';
import { SubscriptionsController } from './controllers/subscriptions.controller';
import { SubscriptionUsageController } from './controllers/subscription-usage.controller';
import { GoalsController } from './controllers/goals.controller';
import { PartnerLimitsController } from './controllers/partner-limits.controller';
import { CatalogsController } from './controllers/catalogs.controller';
import { CustomerTiersController } from './controllers/customer-tiers.controller';
import { CustomerMembershipsController } from './controllers/customer-memberships.controller';
import { BillingCyclesController } from './controllers/billing-cycles.controller';
import { InvoicesController } from './controllers/invoices.controller';
import { PaymentsController } from './controllers/payments.controller';
import { PaymentWebhooksController } from './controllers/payment-webhooks.controller';
import { PartnerStaffAssignmentsController } from './controllers/partner-staff-assignments.controller';
import { CommissionsController } from './controllers/commissions.controller';
import { CommunicationController } from './controllers/communication.controller';
import { CommunicationWebhooksController } from './controllers/communication-webhooks.controller';
import { ProfilesController } from './controllers/profiles.controller';
import { UserProfilesController } from './controllers/user-profiles.controller';
import { PermissionsController } from './controllers/permissions.controller';
import { UserPermissionsController } from './controllers/user-permissions.controller';
import { ProfilePermissionsController } from './controllers/profile-permissions.controller';
import { PartnerUsersController } from './controllers/partner-users.controller';
import {
  CreateUserHandler,
  GetUserProfileHandler,
  LockUserHandler,
  UnlockUserHandler,
  DeleteUserHandler,
  GetUserChangeHistoryHandler,
  UserChangeHistoryService,
  UpdateUserProfileHandler,
  UpdateMyProfileHandler,
  UpdatePartnerUserAssignmentHandler,
  UpdateUserPasswordHandler,
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
  GetPartnerLimitsHandler,
  UpdatePartnerLimitsHandler,
  GetPartnerAccountBalanceHandler,
  CreateTenantHandler,
  GetTenantHandler,
  GetTenantsByPartnerHandler,
  UpdateTenantHandler,
  DeleteTenantHandler,
  GetTenantDashboardStatsHandler,
  TenantAnalyticsUpdaterService,
  CreateBranchHandler,
  GetBranchHandler,
  GetBranchesByTenantHandler,
  UpdateBranchHandler,
  DeleteBranchHandler,
    GetCurrenciesHandler,
    GetCountriesHandler,
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
  AssignPartnerRequestUserHandler,
  UpdatePartnerRequestHandler,
  DeletePartnerRequestHandler,
  GetAdminStaffUsersHandler,
  CreateSubscriptionHandler,
  GetSubscriptionHandler,
  GetSubscriptionsHandler,
  UpdateSubscriptionHandler,
  DeleteSubscriptionHandler,
  GetSubscriptionStatsHandler,
  SubscriptionStatsService,
  GetSubscriptionEventsHandler,
  GetSubscriptionStatsCompareHandler,
  GetSubscriptionTimeseriesHandler,
  SubscriptionTimeseriesService,
  SubscriptionEventHelper,
  CreateSubscriptionUsageHandler,
  GetSubscriptionUsageHandler,
  UpdateSubscriptionUsageHandler,
  DeleteSubscriptionUsageHandler,
  RecalculateSubscriptionUsageHandler,
  CreateSubscriptionAlertHandler,
  GetCatalogsHandler,
  GetCatalogHandler,
  CreateCatalogHandler,
  UpdateCatalogHandler,
    DeleteCatalogHandler,
    GetCustomerTiersHandler,
  GetCustomerTierHandler,
  CreateCustomerTierHandler,
  UpdateCustomerTierHandler,
  DeleteCustomerTierHandler,
  GetCustomerMembershipsHandler,
  GetCustomerMembershipHandler,
  CreateCustomerMembershipHandler,
  UpdateCustomerMembershipHandler,
  DeleteCustomerMembershipHandler,
  CreateBillingCycleHandler,
  GetBillingCycleHandler,
  GetBillingCyclesHandler,
  GetBillingCyclePaymentsHandler,
  DeleteBillingCycleHandler,
  CreateInvoiceHandler,
  GetInvoiceHandler,
  GetInvoicesHandler,
  DeleteInvoiceHandler,
  CreatePaymentHandler,
  GetPaymentHandler,
  GetPaymentsHandler,
  DeletePaymentHandler,
  BillingCycleGeneratorService,
  InvoiceReminderService,
  CreditBalanceService,
  CreatePartnerStaffAssignmentHandler,
  UpdatePartnerStaffAssignmentHandler,
  DeletePartnerStaffAssignmentHandler,
  GetPartnerStaffAssignmentsHandler,
  PartnerStaffAssignmentService,
  CommissionCalculationService,
  GetPaymentCommissionsHandler,
  GetBillingCycleCommissionsHandler,
  GetCommissionsHandler,
  GetCommissionSummaryHandler,
  MarkCommissionsPaidHandler,
  GetPendingDisbursementsHandler,
  GetCommissionsDashboardHandler,
  CreateGoalHandler,
  // Communication Handlers - Templates
  CreateTemplateHandler,
  GetTemplatesHandler,
  GetTemplateHandler,
  UpdateTemplateHandler,
  DeleteTemplateHandler,
  // Communication Handlers - Messages
  CreateMessageHandler,
  GetMessagesHandler,
  GetMessageHandler,
  GetStatsHandler,
  UpdateMessageHandler,
  DeleteMessageHandler,
  GetRecipientsHandler,
  UpdateRecipientStatusHandler,
  MessageSenderService,
  ScheduledMessageSenderService,
  // Handlers de aplicación - Goals
  GetGoalHandler,
  GetGoalsHandler,
  UpdateGoalHandler,
  DeleteGoalHandler,
  GetGoalProgressHandler,
  GoalProgressService,
  // Permissions Service
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
  GetProfileUsersHandler,
  // Permissions Handlers
  CreatePermissionHandler,
  GetPermissionsHandler,
  GetPermissionHandler,
  UpdatePermissionHandler,
  DeletePermissionHandler,
  // User Permissions Handlers
  AssignPermissionToUserHandler,
  RemovePermissionFromUserHandler,
  GetUserPermissionsHandler,
  GetPermissionUsersHandler,
  // Profile Permissions Handlers
  AddPermissionToProfileHandler,
  RemovePermissionFromProfileHandler,
  GetProfilePermissionsHandler,
  GetPermissionProfilesHandler,
  // Partner Users Handlers
  CreatePartnerUserHandler,
  CreatePartnerStaffUserHandler,
  GetPartnerUsersHandler,
  UpdatePartnerUserPasswordHandler,
  SubscriptionUsageModule,
} from '@libs/application';
import { InfrastructureModule, StorageModule } from '@libs/infrastructure';
import { HealthController, LoggerModule } from '@libs/shared';
import { AdminAuthModule } from './auth/admin-auth.module';

/**
 * Módulo principal de la Admin API
 * Configura todos los controladores y servicios necesarios
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    InfrastructureModule,
    StorageModule,
    AdminAuthModule,
    SubscriptionUsageModule,
    LoggerModule,
  ],
  controllers: [
    UsersController,
    PricingController,
    RateExchangeController,
    PartnersController,
    TenantsController,
    BranchesController,
    UploadController,
    CurrenciesController,
    NotificationsController,
    PartnerRequestsController,
    SubscriptionsController,
    SubscriptionUsageController,
    PartnerLimitsController,
    CatalogsController,
    CustomerTiersController,
    CustomerMembershipsController,
    BillingCyclesController,
    InvoicesController,
    PaymentsController,
    PaymentWebhooksController,
    GoalsController,
    PartnerStaffAssignmentsController,
    CommissionsController,
    CommunicationController,
    CommunicationWebhooksController,
    ProfilesController,
    UserProfilesController,
    PermissionsController,
    UserPermissionsController,
    ProfilePermissionsController,
    PartnerUsersController,
    HealthController,
  ],
  providers: [
    // Handlers de aplicación - Users
    CreateUserHandler,
    GetUserProfileHandler,
    LockUserHandler,
    UnlockUserHandler,
    DeleteUserHandler,
    GetUserChangeHistoryHandler,
    UserChangeHistoryService,
    UpdateUserProfileHandler,
    UpdateMyProfileHandler,
    GetAdminStaffUsersHandler,
    UpdatePartnerUserAssignmentHandler,
    UpdateUserPasswordHandler,
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
    GetPartnerLimitsHandler,
    UpdatePartnerLimitsHandler,
    GetPartnerAccountBalanceHandler,
    // Handlers de aplicación - Tenants
    CreateTenantHandler,
    GetTenantHandler,
    GetTenantsByPartnerHandler,
    UpdateTenantHandler,
    DeleteTenantHandler,
    GetTenantDashboardStatsHandler,
    // Servicios de aplicación - Tenant Analytics
    TenantAnalyticsUpdaterService,
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
    AssignPartnerRequestUserHandler,
    UpdatePartnerRequestHandler,
    DeletePartnerRequestHandler,
    // Handlers de aplicación - Subscriptions
    CreateSubscriptionHandler,
    GetSubscriptionHandler,
    GetSubscriptionsHandler,
    UpdateSubscriptionHandler,
    DeleteSubscriptionHandler,
    GetSubscriptionStatsHandler,
    SubscriptionStatsService,
    GetSubscriptionEventsHandler,
    GetSubscriptionStatsCompareHandler,
    GetSubscriptionTimeseriesHandler,
    SubscriptionTimeseriesService,
    SubscriptionEventHelper,
    // Handlers de aplicación - Subscription Usage
    CreateSubscriptionUsageHandler,
    GetSubscriptionUsageHandler,
    UpdateSubscriptionUsageHandler,
    DeleteSubscriptionUsageHandler,
    RecalculateSubscriptionUsageHandler,
    // Handlers de aplicación - Subscription Alerts
    CreateSubscriptionAlertHandler,
    // Handlers de aplicación - Catalogs
    GetCatalogsHandler,
    GetCatalogHandler,
    CreateCatalogHandler,
    UpdateCatalogHandler,
    DeleteCatalogHandler,
    // Handlers de aplicación - Customer Tiers
    GetCustomerTiersHandler,
    GetCustomerTierHandler,
    CreateCustomerTierHandler,
    UpdateCustomerTierHandler,
    DeleteCustomerTierHandler,
    // Handlers de aplicación - Customer Memberships
    GetCustomerMembershipsHandler,
    GetCustomerMembershipHandler,
    CreateCustomerMembershipHandler,
    UpdateCustomerMembershipHandler,
    DeleteCustomerMembershipHandler,
    // Handlers de aplicación - Billing Cycles
    CreateBillingCycleHandler,
    GetBillingCycleHandler,
    GetBillingCyclesHandler,
    GetBillingCyclePaymentsHandler,
    DeleteBillingCycleHandler,
    // Handlers de aplicación - Invoices
    CreateInvoiceHandler,
    GetInvoiceHandler,
    GetInvoicesHandler,
    DeleteInvoiceHandler,
    // Handlers de aplicación - Payments
    CreatePaymentHandler,
    GetPaymentHandler,
    GetPaymentsHandler,
    DeletePaymentHandler,
    // Servicios de aplicación - Billing Cycles
    BillingCycleGeneratorService,
    // Servicios de aplicación - Subscriptions
    CreditBalanceService,
    // Servicios de aplicación - Invoices
    InvoiceReminderService,
    // Handlers de aplicación - Partner Staff Assignments
    CreatePartnerStaffAssignmentHandler,
    UpdatePartnerStaffAssignmentHandler,
    DeletePartnerStaffAssignmentHandler,
    GetPartnerStaffAssignmentsHandler,
    PartnerStaffAssignmentService,
    // Servicios de aplicación - Commissions
    CommissionCalculationService,
    // Handlers de aplicación - Commissions
    GetPaymentCommissionsHandler,
    GetBillingCycleCommissionsHandler,
    GetCommissionsHandler,
    GetCommissionSummaryHandler,
    MarkCommissionsPaidHandler,
    GetPendingDisbursementsHandler,
    GetCommissionsDashboardHandler,
    // Handlers de aplicación - Goals
    CreateGoalHandler,
    GetGoalHandler,
    GetGoalsHandler,
    UpdateGoalHandler,
    DeleteGoalHandler,
    GetGoalProgressHandler,
    GoalProgressService,
    // Communication Handlers - Templates
    CreateTemplateHandler,
    GetTemplatesHandler,
    GetTemplateHandler,
    UpdateTemplateHandler,
    DeleteTemplateHandler,
    // Communication Handlers - Messages
    CreateMessageHandler,
    GetMessagesHandler,
    GetMessageHandler,
    GetStatsHandler,
    UpdateMessageHandler,
    DeleteMessageHandler,
    GetRecipientsHandler,
    UpdateRecipientStatusHandler,
    MessageSenderService,
    ScheduledMessageSenderService,
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
    GetProfileUsersHandler,
    // Permissions Handlers
    CreatePermissionHandler,
    GetPermissionsHandler,
    GetPermissionHandler,
    UpdatePermissionHandler,
    DeletePermissionHandler,
    // User Permissions Handlers
    AssignPermissionToUserHandler,
    RemovePermissionFromUserHandler,
    GetUserPermissionsHandler,
    GetPermissionUsersHandler,
    // Profile Permissions Handlers
    AddPermissionToProfileHandler,
    RemovePermissionFromProfileHandler,
    GetProfilePermissionsHandler,
    GetPermissionProfilesHandler,
    // Partner Users Handlers
    CreatePartnerUserHandler,
    CreatePartnerStaffUserHandler,
    GetPartnerUsersHandler,
    UpdatePartnerUserPasswordHandler,
  ],
})
export class AdminApiModule {}
