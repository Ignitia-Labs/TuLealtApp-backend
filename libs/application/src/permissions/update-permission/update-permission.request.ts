import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para actualizar un permiso
 * Todos los campos son opcionales (actualización parcial PATCH)
 */
export class UpdatePermissionRequest {
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
    description: 'Indica si el permiso está activo (opcional)',
    example: true,
    type: Boolean,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
