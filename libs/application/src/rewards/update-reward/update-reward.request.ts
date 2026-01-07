import { IsOptional, IsString, IsNumber, MinLength, Min, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para actualizar una recompensa
 * Todos los campos son opcionales para permitir actualización parcial (PATCH)
 */
export class UpdateRewardRequest {
  @ApiProperty({
    description: 'Nombre de la recompensa',
    example: 'Descuento del 20%',
    type: String,
    minLength: 2,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @ApiProperty({
    description: 'Descripción de la recompensa',
    example: 'Obtén un descuento del 20% en tu próxima compra',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Puntos requeridos para canjear la recompensa',
    example: 500,
    type: Number,
    minimum: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  pointsRequired?: number;

  @ApiProperty({
    description: 'Stock disponible (-1 para ilimitado)',
    example: 100,
    type: Number,
    minimum: -1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(-1)
  stock?: number;

  @ApiProperty({
    description: 'Categoría de la recompensa',
    example: 'Descuentos',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'URL de la imagen de la recompensa',
    example: 'https://example.com/reward-image.jpg',
    type: String,
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  image?: string | null;

  @ApiProperty({
    description: 'Máximo de canjes por usuario (null para ilimitado)',
    example: 1,
    type: Number,
    required: false,
    nullable: true,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxRedemptionsPerUser?: number | null;

  @ApiProperty({
    description: 'Estado de la recompensa',
    example: 'active',
    enum: ['active', 'inactive', 'out_of_stock'],
    enumName: 'RewardStatus',
    required: false,
  })
  @IsEnum(['active', 'inactive', 'out_of_stock'])
  @IsOptional()
  status?: 'active' | 'inactive' | 'out_of_stock';

  @ApiProperty({
    description: 'Términos y condiciones de la recompensa',
    example: 'Válido hasta fin de mes. No acumulable con otras promociones.',
    type: String,
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  terms?: string | null;

  @ApiProperty({
    description: 'Fecha de vencimiento de la recompensa',
    example: '2024-12-31T23:59:59Z',
    type: String,
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  validUntil?: string | null;
}
