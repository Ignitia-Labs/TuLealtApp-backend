import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para actualizar un permiso
 */
export class UpdatePermissionResponse {
  @ApiProperty({
    description: 'ID único del permiso',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Código único del permiso',
    example: 'admin.users.create',
    type: String,
  })
  code: string;

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
    example: 'Permite crear nuevos usuarios en el sistema',
    type: String,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Indica si el permiso está activo',
    example: true,
    type: Boolean,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de creación del permiso',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del permiso',
    example: '2024-01-20T14:45:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(
    id: number,
    code: string,
    module: string,
    resource: string,
    action: string,
    description: string | null,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.code = code;
    this.module = module;
    this.resource = resource;
    this.action = action;
    this.description = description;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

