import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener un pago por ID
 */
export class GetPaymentRequest {
  @ApiProperty({
    description: 'ID del pago',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  paymentId: number;
}
