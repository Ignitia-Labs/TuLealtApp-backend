import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para revocar refresh tokens (logout)
 */
export class RevokeRefreshTokenRequest {
  @ApiProperty({
    description: 'Refresh token JWT a revocar',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTcwNTMyMTYwMCwiZXhwIjoxNzA1OTI2NDAwfQ.example',
    required: false,
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiProperty({
    description: 'Si es true, revoca todos los refresh tokens del usuario (logout de todos los dispositivos)',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  revokeAll?: boolean;
}
