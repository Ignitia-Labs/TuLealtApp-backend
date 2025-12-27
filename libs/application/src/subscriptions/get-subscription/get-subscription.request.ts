import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener una suscripción por ID
 */
export class GetSubscriptionRequest {
  @ApiProperty({
    description: 'ID de la suscripción',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  subscriptionId: number;
}

