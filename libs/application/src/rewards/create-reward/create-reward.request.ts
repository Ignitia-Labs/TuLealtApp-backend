import { IsNotEmpty, IsString, IsNumber, IsOptional, MinLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para crear una recompensa
 */
export class CreateRewardRequest {
  @ApiProperty({
    description: 'ID del tenant al que pertenece la recompensa',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  tenantId: number;

  @ApiProperty({
    description: 'Nombre de la recompensa',
    example: 'Descuento del 20%',
    type: String,
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: 'Descripción de la recompensa',
    example: 'Obtén un descuento del 20% en tu próxima compra',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Puntos requeridos para canjear la recompensa',
    example: 500,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  pointsRequired: number;

  @ApiProperty({
    description: 'Stock disponible (-1 para ilimitado)',
    example: 100,
    type: Number,
    minimum: -1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(-1)
  stock: number;

  @ApiProperty({
    description: 'Categoría de la recompensa',
    example: 'Descuentos',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  category: string;

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
