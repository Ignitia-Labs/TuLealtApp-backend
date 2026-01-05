import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener una recompensa por ID
 */
export class GetRewardRequest {
  @ApiProperty({
    description: 'ID de la recompensa',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  rewardId: number;
}
