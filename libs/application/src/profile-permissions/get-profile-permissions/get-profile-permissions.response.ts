import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de permisos de un perfil
 */
export class ProfilePermissionDto {
  @ApiProperty({
    description: 'ID único de la relación perfil-permiso',
    example: 1,
    type: Number,
  })
  id: number;

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
    description: 'Módulo del permiso',
    example: 'admin',
    type: String,
  })
  module: string;

  @ApiProperty({
    description: 'Recurso del permiso',
    example: 'users',
    type: String,
  })
  resource: string;

  @ApiProperty({
    description: 'Acción del permiso',
    example: 'create',
    type: String,
  })
  action: string;

  @ApiProperty({
    description: 'Descripción del permiso',
    example: 'Permite crear usuarios',
    type: String,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Fecha de creación de la relación',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  constructor(
    id: number,
    permissionId: number,
    permissionCode: string,
    module: string,
    resource: string,
    action: string,
    description: string | null,
    createdAt: Date,
  ) {
    this.id = id;
    this.permissionId = permissionId;
    this.permissionCode = permissionCode;
    this.module = module;
    this.resource = resource;
    this.action = action;
    this.description = description;
    this.createdAt = createdAt;
  }
}

/**
 * DTO de response para obtener permisos de un perfil
 */
export class GetProfilePermissionsResponse {
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
    description: 'Lista de permisos asignados al perfil',
    type: ProfilePermissionDto,
    isArray: true,
  })
  permissions: ProfilePermissionDto[];

  @ApiProperty({
    description: 'Total de permisos asignados',
    example: 5,
    type: Number,
  })
  total: number;

  constructor(
    profileId: number,
    profileName: string,
    permissions: ProfilePermissionDto[],
    total: number,
  ) {
    this.profileId = profileId;
    this.profileName = profileName;
    this.permissions = permissions;
    this.total = total;
  }
}

