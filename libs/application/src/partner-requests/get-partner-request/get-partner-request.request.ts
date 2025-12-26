import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener una solicitud de partner por ID
 */
export class GetPartnerRequestRequest {
  @ApiProperty({
    description: 'ID de la solicitud',
    example: 1,
    type: Number,
  })
  @IsNumber()
  id: number;
}
