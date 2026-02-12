import { ApiProperty } from '@nestjs/swagger';
import { PartnerInfoDto } from '../partner-info.dto';
import { TenantInfoDto } from '../tenant-info.dto';
import { BranchInfoDto } from '../branch-info.dto';

/**
 * DTO de response para autenticar un usuario
 */
export class AuthenticateUserResponse {
  @ApiProperty({
    description: 'Token JWT de acceso (access token)',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlcyI6WyJBRE1JTiJdLCJpYXQiOjE3MDUzMjE2MDAsImV4cCI6MTcwNTQwODAwMH0.example',
  })
  token: string;

  @ApiProperty({
    description: 'Token JWT de refresco (refresh token) para renovar el access token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTcwNTMyMTYwMCwiZXhwIjoxNzA1OTI2NDAwfQ.example',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Información del usuario autenticado',
    example: {
      id: 1,
      email: 'admin@example.com',
      name: 'Admin User',
      roles: ['ADMIN'],
    },
  })
  user: {
    id: number;
    email: string;
    name: string;
    roles: string[];
  };

  @ApiProperty({
    description: 'Información del partner asociado (solo para usuarios PARTNER y PARTNER_STAFF)',
    type: PartnerInfoDto,
    nullable: true,
    required: false,
  })
  partner?: PartnerInfoDto | null;

  @ApiProperty({
    description: 'Información del tenant asociado (solo para usuarios PARTNER y PARTNER_STAFF)',
    type: TenantInfoDto,
    nullable: true,
    required: false,
  })
  tenant?: TenantInfoDto | null;

  @ApiProperty({
    description: 'Información del branch asociado (solo para usuarios PARTNER y PARTNER_STAFF)',
    type: BranchInfoDto,
    nullable: true,
    required: false,
  })
  branch?: BranchInfoDto | null;

  constructor(
    token: string,
    refreshToken: string,
    user: { id: number; email: string; name: string; roles: string[] },
    partner?: PartnerInfoDto | null,
    tenant?: TenantInfoDto | null,
    branch?: BranchInfoDto | null,
  ) {
    this.token = token;
    this.refreshToken = refreshToken;
    this.user = user;
    this.partner = partner ?? null;
    this.tenant = tenant ?? null;
    this.branch = branch ?? null;
  }
}
