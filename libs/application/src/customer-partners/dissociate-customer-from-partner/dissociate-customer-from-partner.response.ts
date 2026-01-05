import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para desasociar un customer de un partner
 */
export class DissociateCustomerFromPartnerResponse {
  @ApiProperty({ description: 'Mensaje de confirmación' })
  message: string;

  @ApiProperty({ description: 'ID de la asociación eliminada', example: 1 })
  associationId: number;

  constructor(message: string, associationId: number) {
    this.message = message;
    this.associationId = associationId;
  }
}
