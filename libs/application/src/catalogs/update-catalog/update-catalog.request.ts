import { IsOptional, IsString, MinLength, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para actualizar un elemento de catálogo
 * Todos los campos son opcionales (actualización parcial PATCH)
 */
export class UpdateCatalogRequest {
  @ApiProperty({
    description: 'Nuevo valor del elemento de catálogo',
    example: 'Restaurantes Actualizado',
    type: String,
    minLength: 1,
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  value?: string;

  @ApiProperty({
    description:
      'Nuevo slug del elemento de catálogo (opcional, se genera automáticamente si se actualiza el value)',
    example: 'restaurantes-actualizado',
    type: String,
    minLength: 1,
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  slug?: string;

  @ApiProperty({
    description: 'Nuevo orden de visualización del elemento',
    example: 2,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @ApiProperty({
    description: 'Nuevo estado activo/inactivo del elemento',
    example: true,
    type: Boolean,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
