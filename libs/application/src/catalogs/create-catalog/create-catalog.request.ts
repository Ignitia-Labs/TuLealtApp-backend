import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CatalogType } from '@libs/domain';

/**
 * DTO de request para crear un elemento de catálogo
 */
export class CreateCatalogRequest {
  @ApiProperty({
    description: 'Tipo de catálogo',
    example: 'BUSINESS_CATEGORIES',
    enum: ['BUSINESS_CATEGORIES', 'REWARD_TYPES', 'PAYMENT_METHODS', 'PAYMENT_CATEGORIES'],
    type: String,
  })
  @IsEnum(['BUSINESS_CATEGORIES', 'REWARD_TYPES', 'PAYMENT_METHODS', 'PAYMENT_CATEGORIES'])
  @IsNotEmpty()
  type: CatalogType;

  @ApiProperty({
    description: 'Valor del elemento de catálogo',
    example: 'Restaurantes',
    type: String,
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  value: string;

  @ApiProperty({
    description:
      'Slug único del elemento de catálogo (opcional, se genera automáticamente desde el value si no se proporciona)',
    example: 'restaurantes',
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
    description: 'Orden de visualización del elemento',
    example: 1,
    type: Number,
    required: false,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @ApiProperty({
    description: 'Indica si el elemento está activo',
    example: true,
    type: Boolean,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
