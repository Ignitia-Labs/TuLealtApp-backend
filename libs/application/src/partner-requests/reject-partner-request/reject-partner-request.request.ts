import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para rechazar una solicitud de partner
 */
export class RejectPartnerRequestRequest {
  @ApiProperty({
    description: 'ID de la solicitud a rechazar',
    example: 1,
    type: Number,
  })
  @IsNumber()
  requestId: number;
}
