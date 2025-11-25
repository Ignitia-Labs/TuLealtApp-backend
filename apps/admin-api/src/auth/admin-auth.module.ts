import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdminAuthController } from './admin-auth.controller';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import {
  AuthenticateUserHandler,
  GetUserProfileHandler,
  JwtAuthService,
} from '@libs/application';
import { InfrastructureModule } from '@libs/infrastructure';

/**
 * Módulo de autenticación para Admin API
 *
 * Proporciona endpoints de autenticación específicos para administradores:
 * - POST /admin/auth/login
 * - GET /admin/auth/me
 *
 * Reutiliza los handlers de la capa de aplicación (@libs/application)
 * para mantener la lógica de negocio centralizada.
 *
 * Configura JWT y Passport para autenticación segura.
 */
@Module({
  imports: [
    InfrastructureModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      } as any,
    }),
  ],
  controllers: [AdminAuthController],
  providers: [
    // Handlers de aplicación reutilizados
    AuthenticateUserHandler,
    GetUserProfileHandler,
    // Servicio JWT
    JwtAuthService,
    // Estrategia Passport JWT
    AdminJwtStrategy,
  ],
  exports: [JwtAuthService],
})
export class AdminAuthModule {}

