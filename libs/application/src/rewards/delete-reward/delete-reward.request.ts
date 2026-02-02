import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para eliminar una recompensa
 */
export class DeleteRewardRequest {
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
