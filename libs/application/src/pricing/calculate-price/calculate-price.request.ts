import { IsNotEmpty, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BillingPeriod } from '@libs/domain';

/**
 * DTO de request para calcular el precio de un plan
 */
export class CalculatePriceRequest {
  @ApiProperty({
    description: 'ID del plan de precios',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  planId: number;

  @ApiProperty({
    description: 'Período de facturación',
    example: 'monthly',
    enum: ['monthly', 'quarterly', 'semiannual', 'annual'],
  })
  @IsEnum(['monthly', 'quarterly', 'semiannual', 'annual'])
  @IsNotEmpty()
  period: BillingPeriod;

  @ApiProperty({
    description: 'Moneda para el cálculo',
    example: 'USD',
    enum: ['USD', 'GTQ'],
    required: false,
    default: 'USD',
  })
  currency?: 'USD' | 'GTQ';
}

