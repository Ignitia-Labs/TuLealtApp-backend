import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO de request para activar/desactivar un plan de precios
 */
export class ToggleStatusPricingPlanRequest {
  @ApiProperty({
    description: 'ID del plan de precios',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  planId: number;
}

