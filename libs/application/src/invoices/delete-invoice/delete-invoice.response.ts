import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para eliminar una factura
 */
export class DeleteInvoiceResponse {
  @ApiProperty({
    description: 'ID de la factura eliminada',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Mensaje de confirmación de eliminación',
    example: 'Invoice deleted successfully',
    type: String,
  })
  message: string;

  constructor(id: number, message: string) {
    this.id = id;
    this.message = message;
  }
}
