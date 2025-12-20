import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO de request para obtener un plan de precios por ID
 */
export class GetPricingPlanByIdRequest {
  @ApiProperty({
    description: 'ID del plan de precios',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  planId: number;
}

