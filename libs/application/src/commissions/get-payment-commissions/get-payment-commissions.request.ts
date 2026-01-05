import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

/**
 * Request DTO para obtener comisiones de un pago
 */
export class GetPaymentCommissionsRequest {
  @ApiProperty({
    description: 'ID del pago',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  paymentId: number;
}
