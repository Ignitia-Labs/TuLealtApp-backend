import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

/**
 * Request DTO para obtener el ciclo de facturación actual del partner
 */
export class GetCurrentBillingCycleRequest {
  @ApiProperty({
    description: 'ID del partner',
    example: 1,
  })
  @IsInt()
  partnerId: number;
}
