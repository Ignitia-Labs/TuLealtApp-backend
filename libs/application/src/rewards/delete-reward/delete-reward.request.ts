import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para eliminar una recompensa
 */
export class DeleteRewardRequest {
  @ApiProperty({
    description: 'ID de la recompensa a eliminar',
    example: 1,
    type: Number,
  })
  rewardId: number;
}
