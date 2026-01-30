import { IsInt, Min, IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
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

  @ApiProperty({
    example: { birthdayMonth: 1 },
    description: 'Metadatos adicionales (opcional)',
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
