import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import {
  CreateUserHandler,
  GetUserProfileHandler,
  LockUserHandler,
  UpdateUserProfileHandler,
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
  controllers: [UsersController, HealthController],
  providers: [
    // Handlers de aplicación
    CreateUserHandler,
    GetUserProfileHandler,
    LockUserHandler,
    UpdateUserProfileHandler,
  ],
})
export class AdminApiModule {}
