import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener una recompensa por ID
 */
export class GetRewardRequest {
  @ApiProperty({
    description: 'ID del tenant',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  tenantId: number;

  @ApiProperty({
    description: 'ID de la recompensa',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  rewardId: number;
}
