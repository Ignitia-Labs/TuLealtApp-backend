import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para eliminar un ciclo de facturación
 */
export class DeleteBillingCycleResponse {
  @ApiProperty({
    description: 'ID del ciclo de facturación eliminado',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Mensaje de confirmación de eliminación',
    example: 'Billing cycle deleted successfully',
    type: String,
  })
  message: string;

  constructor(id: number, message: string) {
    this.id = id;
    this.message = message;
  }
}

