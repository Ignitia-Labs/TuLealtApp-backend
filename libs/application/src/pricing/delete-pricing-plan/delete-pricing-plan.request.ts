import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO de request para eliminar un plan de precios
 */
export class DeletePricingPlanRequest {
  @ApiProperty({
    description: 'ID del plan de precios a eliminar',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  planId: number;
}
