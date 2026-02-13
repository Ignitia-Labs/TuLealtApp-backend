import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

/**
 * Request DTO para obtener la información de la suscripción del partner
 */
export class GetPartnerSubscriptionRequest {
  @ApiProperty({
    description: 'ID del partner',
    example: 1,
  })
  @IsInt()
  partnerId: number;
}
