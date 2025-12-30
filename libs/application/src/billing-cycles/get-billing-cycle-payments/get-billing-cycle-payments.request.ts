import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener payments de un billing cycle
 */
export class GetBillingCyclePaymentsRequest {
  @ApiProperty({
    description: 'ID del billing cycle',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  billingCycleId: number;
}

