import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';
import {
  RegisterUserHandler,
  AuthenticateUserHandler,
  GetUserProfileHandler,
  CreateUserHandler,
  JwtAuthService,
} from '@libs/application';
import { InfrastructureModule } from '@libs/infrastructure';

/**
 * Módulo de autenticación para Customer API
 *
 * Proporciona endpoints de autenticación específicos para clientes:
 * - POST /customer/auth/register
 * - POST /customer/auth/login
 * - GET /customer/auth/me
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
  controllers: [CustomerAuthController],
  providers: [
    // Handlers de aplicación reutilizados
    CreateUserHandler, // Necesario para RegisterUserHandler
    RegisterUserHandler,
    AuthenticateUserHandler,
    GetUserProfileHandler,
    // Servicio JWT
    JwtAuthService,
    // Estrategia Passport JWT
    CustomerJwtStrategy,
  ],
  exports: [JwtAuthService],
})
export class CustomerAuthModule {}
