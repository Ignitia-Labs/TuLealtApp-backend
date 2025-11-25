import { Injectable, UnauthorizedException, Inject, Optional } from '@nestjs/common';
import { IUserRepository } from '@libs/domain';
import { AuthenticateUserRequest } from './authenticate-user.request';
import { AuthenticateUserResponse } from './authenticate-user.response';
import { JwtAuthService } from '../services/jwt.service';
import * as bcrypt from 'bcrypt';

/**
 * Handler para el caso de uso de autenticar un usuario
 * Genera tokens JWT reales con información del usuario
 */
@Injectable()
export class AuthenticateUserHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Optional()
    private readonly jwtAuthService?: JwtAuthService,
  ) {}

  /**
   * Ejecuta la autenticación del usuario
   * @param request Datos de autenticación
   * @param context Contexto de la aplicación (admin, partner, customer)
   * @param requiredRole Rol requerido para autenticarse en este contexto (opcional)
   * @returns Token JWT y datos del usuario
   */
  async execute(
    request: AuthenticateUserRequest,
    context?: string,
    requiredRole?: string,
  ): Promise<AuthenticateUserResponse> {
    // Buscar usuario por email
    const user = await this.userRepository.findByEmail(request.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verificar que el usuario esté activo
    if (!user.isActiveUser()) {
      throw new UnauthorizedException('User account is locked');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(request.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validar rol requerido si se especifica
    if (requiredRole && !user.hasRole(requiredRole)) {
      throw new UnauthorizedException(`User does not have required role: ${requiredRole}`);
    }

    // Generar token JWT
    const token = this.generateJwtToken(user, context || 'default');

    return new AuthenticateUserResponse(token, {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
    });
  }

  /**
   * Genera un token JWT con la información del usuario
   */
  private generateJwtToken(user: any, context: string): string {
    if (this.jwtAuthService) {
      return this.jwtAuthService.generateAccessToken({
        userId: user.id,
        email: user.email,
        roles: user.roles,
        context,
      });
    }

    // Fallback si el servicio JWT no está disponible (no debería pasar en producción)
    throw new Error('JWT service is not available');
  }
}
