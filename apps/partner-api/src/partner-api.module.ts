import { Module } from '@nestjs/common';
import { OrdersController } from './controllers/orders.controller';
import { PricingController } from './controllers/pricing.controller';
import { ProfilesController } from './controllers/profiles.controller';
import { UserProfilesController } from './controllers/user-profiles.controller';
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
    // Aquí se agregarían los handlers específicos de partner
    // Por ejemplo: GetOrdersByPartnerHandler, CreateProductHandler, etc.
  ],
})
export class PartnerApiModule {}
