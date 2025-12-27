import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para eliminar un registro de uso de suscripción
 */
export class DeleteSubscriptionUsageResponse {
  @ApiProperty({
    description: 'ID de la suscripción',
    example: 1,
    type: Number,
  })
  partnerSubscriptionId: number;

  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Subscription usage deleted successfully',
    type: String,
  })
  message: string;

  constructor(partnerSubscriptionId: number, message: string) {
    this.partnerSubscriptionId = partnerSubscriptionId;
    this.message = message;
  }
}

