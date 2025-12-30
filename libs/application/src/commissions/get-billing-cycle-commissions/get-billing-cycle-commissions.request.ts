import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

/**
 * Request DTO para obtener comisiones de un billing cycle
 */
export class GetBillingCycleCommissionsRequest {
  @ApiProperty({
    description: 'ID del billing cycle',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  billingCycleId: number;
}

