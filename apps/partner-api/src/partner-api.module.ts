import { Module } from '@nestjs/common';
import { OrdersController } from './controllers/orders.controller';
import { PricingController } from './controllers/pricing.controller';
import { ProfilesController } from './controllers/profiles.controller';
import { UserProfilesController } from './controllers/user-profiles.controller';
import { PartnerUsersController } from './controllers/partner-users.controller';
import { UserPermissionsController } from './controllers/user-permissions.controller';
import { CatalogsController } from './controllers/catalogs.controller';
import { PartnersController } from './controllers/partners.controller';
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
} from '@libs/application';

/**
 * Módulo principal de la Partner API
 * Configura todos los controladores y servicios necesarios
 */
@Module({
  imports: [InfrastructureModule, PartnerAuthModule],
  controllers: [
    OrdersController,
    PricingController,
    ProfilesController,
    UserProfilesController,
    PartnerUsersController,
    UserPermissionsController,
    CatalogsController,
    PartnersController,
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
    // Aquí se agregarían los handlers específicos de partner
    // Por ejemplo: GetOrdersByPartnerHandler, CreateProductHandler, etc.
  ],
})
export class PartnerApiModule {}
