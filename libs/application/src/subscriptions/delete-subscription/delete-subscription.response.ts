import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para eliminar una suscripción
 */
export class DeleteSubscriptionResponse {
  @ApiProperty({
    description: 'ID de la suscripción eliminada',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Subscription deleted successfully',
    type: String,
  })
  message: string;

  constructor(id: number, message: string) {
    this.id = id;
    this.message = message;
  }
}
