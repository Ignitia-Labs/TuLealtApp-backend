import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para canjear una recompensa
 */
export class RedeemRewardRequest {
  @ApiProperty({
    description: 'ID de la membership del cliente',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  membershipId: number;

  @ApiProperty({
    description: 'ID de la recompensa a canjear',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  rewardId: number;
}
