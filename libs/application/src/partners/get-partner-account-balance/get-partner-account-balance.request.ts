import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener el estado de cuenta del partner
 */
export class GetPartnerAccountBalanceRequest {
  @ApiProperty({
    description: 'ID del partner',
    example: 1,
    type: Number,
  })
  @IsNumber()
  partnerId: number;
}

