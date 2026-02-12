import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PartnerAuthController } from './partner-auth.controller';
import { PartnerJwtStrategy } from './strategies/partner-jwt.strategy';
import {
  AuthenticatePartnerUserHandler,
  GetUserProfileHandler,
  RefreshTokenHandler,
  RevokeRefreshTokenHandler,
  JwtAuthService,
} from '@libs/application';
import { InfrastructureModule } from '@libs/infrastructure';

/**
 * Módulo de autenticación para Partner API
 *
 * Proporciona endpoints de autenticación específicos para partners:
 * - POST /partner/auth/login
 * - POST /partner/auth/refresh
 * - POST /partner/auth/logout
 * - GET /partner/auth/me
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
  controllers: [PartnerAuthController],
  providers: [
    // Handler específico para autenticación de partner
    AuthenticatePartnerUserHandler,
    GetUserProfileHandler,
    RefreshTokenHandler,
    RevokeRefreshTokenHandler,
    // Servicio JWT
    JwtAuthService,
    // Estrategia Passport JWT
    PartnerJwtStrategy,
  ],
  exports: [JwtAuthService],
})
export class PartnerAuthModule {}
