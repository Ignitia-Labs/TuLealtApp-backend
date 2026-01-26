import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para eliminar una solicitud de partner
 */
export class DeletePartnerRequestResponse {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Partner request deleted successfully',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'ID de la solicitud eliminada',
    example: 1,
    type: Number,
  })
  id: number;

  constructor(message: string, id: number) {
    this.message = message;
    this.id = id;
  }
}
