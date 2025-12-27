import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para eliminar un registro de uso de suscripción
 */
export class DeleteSubscriptionUsageRequest {
  @ApiProperty({
    description: 'ID de la suscripción',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  partnerSubscriptionId: number;
}

