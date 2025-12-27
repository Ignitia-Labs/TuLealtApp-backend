import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener los límites de un partner
 */
export class GetPartnerLimitsRequest {
  @ApiProperty({
    description: 'ID único del partner',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  partnerId: number;
}

