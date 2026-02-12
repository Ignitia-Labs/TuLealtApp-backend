import { Injectable, UnauthorizedException, Inject, Optional } from '@nestjs/common';
import { IUserRepository, IRefreshTokenRepository, RefreshToken } from '@libs/domain';
import { AuthenticateUserRequest } from './authenticate-user.request';
import { AuthenticateUserResponse } from './authenticate-user.response';
import { JwtAuthService } from '../services/jwt.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

/**
 * Handler para el caso de uso de autenticar un usuario
 * Genera tokens JWT (access y refresh) con información del usuario
 */
@Injectable()
export class AuthenticateUserHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Optional()
    private readonly jwtAuthService?: JwtAuthService,
  ) {}

  /**
   * Ejecuta la autenticación del usuario
   * @param request Datos de autenticación
   * @param context Contexto de la aplicación (admin, partner, customer)
   * @param requiredRole Rol requerido para autenticarse en este contexto (opcional)
   * @param userAgent User agent del cliente (opcional)
   * @param ipAddress IP address del cliente (opcional)
   * @returns Access token, refresh token y datos del usuario
   */
  async execute(
    request: AuthenticateUserRequest,
    context?: string,
    requiredRole?: string,
    userAgent?: string,
    ipAddress?: string,
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

    // Validar contexto según rol del usuario
    if (context === 'customer' && !user.hasRole('CUSTOMER')) {
      throw new UnauthorizedException('Only customers can access customer API');
    }

    if (context === 'admin' && !user.hasRole('ADMIN') && !user.hasRole('STAFF')) {
      throw new UnauthorizedException('Only admins and staff can access admin API');
    }

    if (context === 'partner' && !user.hasRole('PARTNER')) {
      throw new UnauthorizedException('Only partners can access partner API');
    }

    // Generar access token JWT
    const accessToken = this.generateAccessToken(user, context || 'default');

    // Generar refresh token JWT
    const refreshTokenJwt = this.generateRefreshToken(user, context || 'default');

    // Guardar refresh token en BD (hasheado)
    await this.saveRefreshToken(user.id, refreshTokenJwt, userAgent, ipAddress);

    return new AuthenticateUserResponse(
      accessToken,
      refreshTokenJwt,
      {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
    );
  }

  /**
   * Genera un access token JWT con la información del usuario
   */
  private generateAccessToken(user: any, context: string): string {
    if (!this.jwtAuthService) {
      throw new Error('JWT service is not available');
    }

    return this.jwtAuthService.generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: user.roles,
      context,
    });
  }

  /**
   * Genera un refresh token JWT con la información del usuario
   */
  private generateRefreshToken(user: any, context: string): string {
    if (!this.jwtAuthService) {
      throw new Error('JWT service is not available');
    }

    return this.jwtAuthService.generateRefreshToken({
      userId: user.id,
      email: user.email,
      roles: user.roles,
      context,
    });
  }

  /**
   * Guarda el refresh token en la base de datos (hasheado)
   * Limita el número de tokens activos por usuario
   */
  private async saveRefreshToken(
    userId: number,
    refreshTokenJwt: string,
    userAgent: string | undefined,
    ipAddress: string | undefined,
  ): Promise<void> {
    // Hashear el token antes de guardarlo (seguridad)
    const tokenHash = this.hashToken(refreshTokenJwt);

    // Calcular fecha de expiración
    const expiresAt = this.jwtAuthService!.getRefreshTokenExpirationDate();

    // Crear entidad de dominio
    const refreshToken = RefreshToken.create(
      userId,
      tokenHash,
      expiresAt,
      userAgent || null,
      ipAddress || null,
    );

    // Guardar en BD
    await this.refreshTokenRepository.save(refreshToken);

    // Limitar tokens activos por usuario (máximo configurado en .env)
    const maxTokens = parseInt(process.env.REFRESH_TOKEN_MAX_PER_USER || '5', 10);
    await this.refreshTokenRepository.deleteOldestIfExceedsLimit(userId, maxTokens);
  }

  /**
   * Hashea un token usando SHA-256
   * @param token Token a hashear
   * @returns Hash SHA-256 del token
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
