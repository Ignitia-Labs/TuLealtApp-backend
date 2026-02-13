import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { IRefreshTokenRepository } from '@libs/domain';
import { RevokeRefreshTokenRequest } from './revoke-refresh-token.request';
import { RevokeRefreshTokenResponse } from './revoke-refresh-token.response';
import * as crypto from 'crypto';

/**
 * Handler para el caso de uso de revocar refresh tokens (logout)
 * Soporta logout de un dispositivo específico o de todos los dispositivos
 */
@Injectable()
export class RevokeRefreshTokenHandler {
  constructor(
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  /**
   * Ejecuta la revocación de refresh token(s)
   * @param userId ID del usuario (obtenido del JWT access token)
   * @param request Datos de revocación
   * @returns Mensaje de confirmación y número de tokens revocados
   */
  async execute(
    userId: number,
    request: RevokeRefreshTokenRequest,
  ): Promise<RevokeRefreshTokenResponse> {
    let tokensRevoked = 0;

    // Opción 1: Revocar todos los tokens del usuario (logout global)
    if (request.revokeAll) {
      tokensRevoked = await this.refreshTokenRepository.revokeAllByUserId(userId);

      return new RevokeRefreshTokenResponse(
        'Logged out from all devices successfully',
        tokensRevoked,
      );
    }

    // Opción 2: Revocar un token específico (logout de un dispositivo)
    if (request.refreshToken) {
      // Hashear el token para buscarlo en BD
      const tokenHash = this.hashToken(request.refreshToken);

      // Revocar el token
      await this.refreshTokenRepository.revokeByTokenHash(tokenHash);
      tokensRevoked = 1;

      return new RevokeRefreshTokenResponse('Logged out successfully', tokensRevoked);
    }

    // Si no se especifica ni refreshToken ni revokeAll, error
    throw new BadRequestException('Either refreshToken or revokeAll must be provided');
  }

  /**
   * Hashea un token usando SHA-256
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
