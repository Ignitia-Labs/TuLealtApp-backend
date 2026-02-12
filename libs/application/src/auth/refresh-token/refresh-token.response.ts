import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para refrescar el access token
 */
export class RefreshTokenResponse {
  @ApiProperty({
    description: 'Nuevo access token JWT',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlcyI6WyJBRE1JTiJdLCJpYXQiOjE3MDUzMjE2MDAsImV4cCI6MTcwNTQwODAwMH0.example',
  })
  token: string;

  @ApiProperty({
    description: 'Nuevo refresh token JWT (single-use strategy)',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTcwNTMyMTYwMCwiZXhwIjoxNzA1OTI2NDAwfQ.example',
  })
  refreshToken: string;

  constructor(token: string, refreshToken: string) {
    this.token = token;
    this.refreshToken = refreshToken;
  }
}
