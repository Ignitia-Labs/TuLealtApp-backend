import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para eliminar un pago
 */
export class DeletePaymentResponse {
  @ApiProperty({
    description: 'ID del pago eliminado',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Mensaje de confirmación de eliminación',
    example: 'Payment deleted successfully',
    type: String,
  })
  message: string;

  constructor(id: number, message: string) {
    this.id = id;
    this.message = message;
  }
}

