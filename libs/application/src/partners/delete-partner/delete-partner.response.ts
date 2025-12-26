import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para eliminar un partner
 */
export class DeletePartnerResponse {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Partner deleted successfully',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'ID del partner eliminado',
    example: 1,
    type: Number,
  })
  id: number;

  constructor(message: string, id: number) {
    this.message = message;
    this.id = id;
  }
}
