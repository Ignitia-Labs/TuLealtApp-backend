import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para eliminar un nivel de cliente
 */
export class DeleteCustomerTierResponse {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Customer tier deleted successfully',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'ID del nivel de cliente eliminado',
    example: 1,
    type: Number,
  })
  id: number;

  constructor(message: string, id: number) {
    this.message = message;
    this.id = id;
  }
}
