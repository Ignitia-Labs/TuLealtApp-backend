import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener un partner por ID
 */
export class GetPartnerRequest {
  @ApiProperty({
    description: 'ID del partner',
    example: 1,
    type: Number,
  })
  @IsNumber()
  partnerId: number;
}
