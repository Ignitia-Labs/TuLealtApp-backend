import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  MinLength,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO de request para actualizar una recompensa
 */
export class UpdateRewardRequest {
  @ApiPropertyOptional({
    description: 'ID del tenant',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  tenantId?: number;

  @ApiPropertyOptional({
    description: 'ID de la recompensa',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  rewardId?: number;

  @ApiPropertyOptional({
    description: 'Nombre de la recompensa',
    example: 'Descuento del 10%',
    type: String,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada',
    type: String,
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    description:
      'URL de la imagen o base64 (data:image/png;base64,...). Si es base64 se sube a S3 y se reemplaza por la URL. png/jpg/webp, máx. 5MB.',
    example:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    type: String,
  })
  @IsOptional()
  @IsString()
  image?: string | null;

  @ApiPropertyOptional({
    description: 'Puntos requeridos',
    example: 100,
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  pointsRequired?: number;

  @ApiPropertyOptional({
    description: 'Stock disponible. Use -1 para stock ilimitado',
    example: 50,
    type: Number,
    minimum: -1,
  })
  @IsOptional()
  @IsNumber()
  @Min(-1)
  stock?: number;

  @ApiPropertyOptional({
    description: 'Límite de canjes por usuario',
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxRedemptionsPerUser?: number | null;

  @ApiPropertyOptional({
    description: 'Estado de la recompensa',
    enum: ['active', 'inactive', 'draft', 'expired'],
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'draft', 'expired'])
  status?: 'active' | 'inactive' | 'draft' | 'expired';

  @ApiPropertyOptional({
    description: 'Categoría',
    type: String,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Términos y condiciones',
    type: String,
  })
  @IsOptional()
  @IsString()
  terms?: string | null;

  @ApiPropertyOptional({
    description: 'Fecha de expiración (ISO 8601). Use null para validez perpetua',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string | null;
}
