import { IsNotEmpty, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para crear un permiso
 */
export class CreatePermissionRequest {
  @ApiProperty({
    description: 'Código único del permiso (ej: "admin.users.create")',
    example: 'admin.users.create',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  code: string;

  @ApiProperty({
    description: 'Módulo del permiso (ej: "admin", "partner")',
    example: 'admin',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  module: string;

  @ApiProperty({
    description: 'Recurso del permiso (ej: "users", "products")',
    example: 'users',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  resource: string;

  @ApiProperty({
    description: 'Acción del permiso (ej: "create", "view", "*")',
    example: 'create',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({
    description: 'Descripción del permiso (opcional)',
    example: 'Permite crear nuevos usuarios en el sistema',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Indica si el permiso está activo',
    example: true,
    type: Boolean,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
