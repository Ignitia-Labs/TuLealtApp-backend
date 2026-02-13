import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { IRefreshTokenRepository, RefreshToken } from '@libs/domain';
import { RefreshTokenRequest } from './refresh-token.request';
import { RefreshTokenResponse } from './refresh-token.response';
import { JwtAuthService } from '../services/jwt.service';
import * as crypto from 'crypto';

/**
 * Handler para el caso de uso de refrescar el access token
 * Implementa estrategia de single-use refresh tokens
 */
@Injectable()
export class RefreshTokenHandler {
  constructor(
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtAuthService: JwtAuthService,
  ) {}

  /**
   * Ejecuta el refresh del access token
   * @param request Refresh token JWT
   * @param userAgent User agent del cliente (opcional)
   * @param ipAddress IP address del cliente (opcional)
   * @returns Nuevo access token y nuevo refresh token
   */
  async execute(
    request: RefreshTokenRequest,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<RefreshTokenResponse> {
    // 1. Verificar que el token sea un refresh token válido
    const payload = this.jwtAuthService.verifyRefreshToken(request.refreshToken);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // 2. Hashear el token para buscarlo en BD
    const tokenHash = this.hashToken(request.refreshToken);

    // 3. Buscar el refresh token en BD
    const storedToken = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    // 4. Verificar que el token no haya sido revocado
    if (storedToken.isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // 5. Verificar que el token no haya expirado
    if (storedToken.isExpired()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // 6. Verificar que el userId del token coincida con el payload
    if (storedToken.userId !== payload.userId) {
      throw new UnauthorizedException('Token user mismatch');
    }

    // 7. Revocar el refresh token anterior (single-use strategy)
    await this.refreshTokenRepository.revokeByTokenHash(tokenHash);

    // 8. Generar nuevo access token
    const newAccessToken = this.jwtAuthService.generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      roles: payload.roles,
      context: payload.context,
      partnerId: payload.partnerId,
    });

    // 9. Generar nuevo refresh token
    const newRefreshTokenJwt = this.jwtAuthService.generateRefreshToken({
      userId: payload.userId,
      email: payload.email,
      roles: payload.roles,
      context: payload.context,
      partnerId: payload.partnerId,
    });

    // 10. Guardar nuevo refresh token en BD (hasheado)
    await this.saveRefreshToken(payload.userId, newRefreshTokenJwt, userAgent, ipAddress);

    // 11. Retornar nuevos tokens
    return new RefreshTokenResponse(newAccessToken, newRefreshTokenJwt);
  }

  /**
   * Guarda el nuevo refresh token en la base de datos (hasheado)
   */
  private async saveRefreshToken(
    userId: number,
    refreshTokenJwt: string,
    userAgent: string | undefined,
    ipAddress: string | undefined,
  ): Promise<void> {
    // Hashear el token antes de guardarlo
    const tokenHash = this.hashToken(refreshTokenJwt);

    // Calcular fecha de expiración
    const expiresAt = this.jwtAuthService.getRefreshTokenExpirationDate();

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

    // Limitar tokens activos por usuario
    const maxTokens = parseInt(process.env.REFRESH_TOKEN_MAX_PER_USER || '5', 10);
    await this.refreshTokenRepository.deleteOldestIfExceedsLimit(userId, maxTokens);
  }

  /**
   * Hashea un token usando SHA-256
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
