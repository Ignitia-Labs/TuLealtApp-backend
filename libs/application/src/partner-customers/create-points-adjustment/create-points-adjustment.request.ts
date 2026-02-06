import { IsInt, Min, IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePointsAdjustmentRequest {
  // membershipId viene del parámetro de ruta :id, no del body
  membershipId?: number;

  @ApiProperty({
    example: 100,
    description: 'Cantidad de puntos a ajustar (positivo para agregar, negativo para quitar)',
  })
  @Type(() => Number)
  @IsInt()
  pointsDelta: number;

  @ApiProperty({
    example: 'BONUS_BIRTHDAY',
    description: 'Código de razón obligatorio (ej: CORRECTION, BONUS, PENALTY)',
  })
  @IsString()
  @IsNotEmpty()
  reasonCode: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'ID de la sucursal donde se realiza el ajuste (opcional)',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number | null;

  @ApiPropertyOptional({
    example: { birthdayMonth: 1 },
    description: 'Metadatos adicionales (opcional)',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
