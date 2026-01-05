import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

/**
 * DTO de request para obtener permisos
 */
export class GetPermissionsRequest {
  @ApiProperty({
    description: 'Módulo para filtrar (opcional)',
    example: 'admin',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  module?: string;

  @ApiProperty({
    description: 'Recurso para filtrar (opcional, requiere module)',
    example: 'users',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  resource?: string;

  @ApiProperty({
    description: 'Número de registros a omitir (paginación)',
    example: 0,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  skip?: number;

  @ApiProperty({
    description: 'Número máximo de registros a retornar',
    example: 50,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  take?: number;

  @ApiProperty({
    description: 'Si se incluyen permisos inactivos en la respuesta',
    example: false,
    type: Boolean,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  includeInactive?: boolean;
}
