import {
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
  IsArray,
  ArrayMinSize,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para actualizar un perfil
 * Todos los campos son opcionales (actualización parcial PATCH)
 */
export class UpdateProfileRequest {
  @ApiProperty({
    description: 'Nuevo nombre del perfil',
    example: 'Gerente de Tienda Actualizado',
    type: String,
    minLength: 2,
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @ApiProperty({
    description: 'Nueva descripción del perfil',
    example: 'Nueva descripción del perfil',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Nuevo array de permisos',
    example: ['admin.users.create', 'admin.users.view'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ArrayMinSize(1)
  @IsString({ each: true })
  permissions?: string[];

  @ApiProperty({
    description: 'Nuevo estado activo/inactivo del perfil',
    example: true,
    type: Boolean,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
