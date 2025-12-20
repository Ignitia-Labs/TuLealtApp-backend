import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener un plan de precios por slug
 */
export class GetPricingPlanBySlugRequest {
  @ApiProperty({
    description: 'Slug del plan de precios',
    example: 'esencia',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;
}

