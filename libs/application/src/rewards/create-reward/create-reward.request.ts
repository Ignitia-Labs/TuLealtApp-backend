import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MinLength,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO de request para crear una recompensa
 */
export class CreateRewardRequest {
  @ApiProperty({
    description: 'ID del tenant propietario de la recompensa',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  tenantId: number;

  @ApiProperty({
    description: 'Nombre de la recompensa',
    example: 'Descuento del 10%',
    type: String,
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada de la recompensa',
    example: 'Obtén un descuento del 10% en tu próxima compra',
    type: String,
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    description: 'URL de la imagen de la recompensa',
    example: 'https://example.com/reward-image.jpg',
    type: String,
  })
  @IsOptional()
  @IsString()
  image?: string | null;

  @ApiProperty({
    description: 'Puntos requeridos para canjear la recompensa',
    example: 100,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  pointsRequired: number;

  @ApiProperty({
    description: 'Cantidad disponible en inventario',
    example: 50,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({
    description: 'Límite de canjes por usuario (null = sin límite)',
    example: 1,
    type: Number,
    nullable: true,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxRedemptionsPerUser?: number | null;

  @ApiPropertyOptional({
    description: 'Estado de la recompensa',
    example: 'draft',
    enum: ['active', 'inactive', 'draft', 'expired'],
    default: 'draft',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'draft', 'expired'])
  status?: 'active' | 'inactive' | 'draft' | 'expired';

  @ApiProperty({
    description: 'Categoría de la recompensa',
    example: 'Descuentos',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({
    description: 'Términos y condiciones de la recompensa',
    example: 'Válido solo para compras mayores a $50',
    type: String,
  })
  @IsOptional()
  @IsString()
  terms?: string | null;

  @ApiPropertyOptional({
    description: 'Fecha de expiración de la recompensa (ISO 8601)',
    example: '2026-12-31T23:59:59Z',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string | null;
}
