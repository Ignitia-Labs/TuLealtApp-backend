import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para revocar refresh tokens (logout)
 */
export class RevokeRefreshTokenResponse {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Logged out successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Número de tokens revocados',
    example: 1,
  })
  tokensRevoked: number;

  constructor(message: string, tokensRevoked: number) {
    this.message = message;
    this.tokensRevoked = tokensRevoked;
  }
}
