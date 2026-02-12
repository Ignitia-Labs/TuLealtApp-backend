import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para refrescar el access token
 */
export class RefreshTokenRequest {
  @ApiProperty({
    description: 'Refresh token JWT para obtener un nuevo access token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTcwNTMyMTYwMCwiZXhwIjoxNzA1OTI2NDAwfQ.example',
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
