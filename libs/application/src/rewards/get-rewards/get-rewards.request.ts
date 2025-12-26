import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener recompensas
 */
export class GetRewardsRequest {
  @ApiProperty({
    description: 'ID del tenant',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  tenantId: number;

  @ApiProperty({
    description: 'Categoría para filtrar (opcional)',
    example: 'Descuentos',
    type: String,
    required: false,
  })
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Solo recompensas disponibles',
    example: true,
    type: Boolean,
    required: false,
  })
  @IsOptional()
  availableOnly?: boolean;
}

