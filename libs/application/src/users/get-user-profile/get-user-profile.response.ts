import { ApiProperty } from '@nestjs/swagger';
import { PartnerInfoDto } from '../../auth/partner-info.dto';
import { TenantInfoDto } from '../../auth/tenant-info.dto';
import { BranchInfoDto } from '../../auth/branch-info.dto';

/**
 * DTO de response para obtener el perfil de un usuario
 */
export class GetUserProfileResponse {
  @ApiProperty({
    description: 'ID del usuario',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'Teléfono del usuario',
    example: '+1234567890',
  })
  phone: string;

  @ApiProperty({
    description: 'Perfil adicional del usuario',
    example: { preferences: { language: 'es', theme: 'light' } },
    nullable: true,
  })
  profile: Record<string, any> | null;

  @ApiProperty({
    description: 'Roles del usuario',
    example: ['CUSTOMER'],
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    description: 'Indica si el usuario está activo',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'ID del partner asociado (solo para usuarios PARTNER y PARTNER_STAFF)',
    example: 1,
    nullable: true,
  })
  partnerId: number | null;

  @ApiProperty({
    description: 'ID del tenant asociado (solo para usuarios PARTNER y PARTNER_STAFF)',
    example: 5,
    nullable: true,
  })
  tenantId: number | null;

  @ApiProperty({
    description: 'ID del branch asociado (solo para usuarios PARTNER y PARTNER_STAFF)',
    example: 10,
    nullable: true,
  })
  branchId: number | null;

  @ApiProperty({
    description: 'Información del partner asociado',
    type: PartnerInfoDto,
    nullable: true,
    required: false,
  })
  partner?: PartnerInfoDto | null;

  @ApiProperty({
    description: 'Información del tenant asociado',
    type: TenantInfoDto,
    nullable: true,
    required: false,
  })
  tenant?: TenantInfoDto | null;

  @ApiProperty({
    description: 'Información del branch asociado',
    type: BranchInfoDto,
    nullable: true,
    required: false,
  })
  branch?: BranchInfoDto | null;

  @ApiProperty({
    description: 'Fecha de creación del usuario',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del usuario',
    example: '2024-01-20T14:45:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(
    id: number,
    email: string,
    name: string,
    firstName: string,
    lastName: string,
    phone: string,
    profile: Record<string, any> | null,
    roles: string[],
    isActive: boolean,
    partnerId: number | null,
    tenantId: number | null,
    branchId: number | null,
    createdAt: Date,
    updatedAt: Date,
    partner?: PartnerInfoDto | null,
    tenant?: TenantInfoDto | null,
    branch?: BranchInfoDto | null,
  ) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.profile = profile;
    this.roles = roles;
    this.isActive = isActive;
    this.partnerId = partnerId;
    this.tenantId = tenantId;
    this.branchId = branchId;
    this.partner = partner ?? null;
    this.tenant = tenant ?? null;
    this.branch = branch ?? null;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
