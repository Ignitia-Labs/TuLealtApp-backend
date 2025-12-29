import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener un ciclo de facturación por ID
 */
export class GetBillingCycleRequest {
  @ApiProperty({
    description: 'ID del ciclo de facturación',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  billingCycleId: number;
}

