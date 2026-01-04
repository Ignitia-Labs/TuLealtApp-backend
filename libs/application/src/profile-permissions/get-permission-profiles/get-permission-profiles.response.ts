import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de perfil con permiso
 */
export class PermissionProfileDto {
  @ApiProperty({
    description: 'ID único de la relación perfil-permiso',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID del perfil',
    example: 1,
    type: Number,
  })
  profileId: number;

  @ApiProperty({
    description: 'Nombre del perfil',
    example: 'Super Admin',
    type: String,
  })
  profileName: string;

  @ApiProperty({
    description: 'Descripción del perfil',
    example: 'Acceso completo al sistema',
    type: String,
    nullable: true,
  })
  profileDescription: string | null;

  @ApiProperty({
    description: 'ID del partner (null si es perfil global)',
    example: 1,
    type: Number,
    nullable: true,
  })
  partnerId: number | null;

  @ApiProperty({
    description: 'Indica si el perfil está activo',
    example: true,
    type: Boolean,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de creación de la relación',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  constructor(
    id: number,
    profileId: number,
    profileName: string,
    profileDescription: string | null,
    partnerId: number | null,
    isActive: boolean,
    createdAt: Date,
  ) {
    this.id = id;
    this.profileId = profileId;
    this.profileName = profileName;
    this.profileDescription = profileDescription;
    this.partnerId = partnerId;
    this.isActive = isActive;
    this.createdAt = createdAt;
  }
}

/**
 * DTO de response para obtener perfiles que tienen un permiso específico
 */
export class GetPermissionProfilesResponse {
  @ApiProperty({
    description: 'ID del permiso',
    example: 5,
    type: Number,
  })
  permissionId: number;

  @ApiProperty({
    description: 'Código del permiso',
    example: 'admin.users.create',
    type: String,
  })
  permissionCode: string;

  @ApiProperty({
    description: 'Lista de perfiles que tienen este permiso',
    type: PermissionProfileDto,
    isArray: true,
  })
  profiles: PermissionProfileDto[];

  @ApiProperty({
    description: 'Total de perfiles con este permiso',
    example: 3,
    type: Number,
  })
  total: number;

  constructor(
    permissionId: number,
    permissionCode: string,
    profiles: PermissionProfileDto[],
    total: number,
  ) {
    this.permissionId = permissionId;
    this.permissionCode = permissionCode;
    this.profiles = profiles;
    this.total = total;
  }
}

