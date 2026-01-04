import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para un permiso directo asignado a un usuario
 */
export class UserPermissionDto {
  @ApiProperty({
    description: 'ID único de la asignación',
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
    example: 'Permite crear nuevos usuarios',
    type: String,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'ID del usuario que asignó el permiso',
    example: 1,
    type: Number,
  })
  assignedBy: number;

  @ApiProperty({
    description: 'Fecha de asignación',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  assignedAt: Date;

  @ApiProperty({
    description: 'Indica si la asignación está activa',
    example: true,
    type: Boolean,
  })
  isActive: boolean;

  constructor(
    id: number,
    permissionId: number,
    permissionCode: string,
    module: string,
    resource: string,
    action: string,
    description: string | null,
    assignedBy: number,
    assignedAt: Date,
    isActive: boolean,
  ) {
    this.id = id;
    this.permissionId = permissionId;
    this.permissionCode = permissionCode;
    this.module = module;
    this.resource = resource;
    this.action = action;
    this.description = description;
    this.assignedBy = assignedBy;
    this.assignedAt = assignedAt;
    this.isActive = isActive;
  }
}

/**
 * DTO de response para obtener permisos directos de un usuario
 */
export class GetUserPermissionsResponse {
  @ApiProperty({
    description: 'Lista de permisos directos asignados al usuario',
    type: UserPermissionDto,
    isArray: true,
  })
  permissions: UserPermissionDto[];

  @ApiProperty({
    description: 'Total de permisos asignados',
    example: 2,
    type: Number,
  })
  total: number;

  constructor(permissions: UserPermissionDto[], total: number) {
    this.permissions = permissions;
    this.total = total;
  }
}

