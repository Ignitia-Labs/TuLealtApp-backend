import { ApiProperty } from '@nestjs/swagger';
import { Reward } from '@libs/domain';
import { CreateRewardResponse } from '../create-reward/create-reward.response';

/**
 * DTO de response para obtener una recompensa
 */
export class GetRewardResponse extends CreateRewardResponse {
  constructor(reward: Reward, totalRedemptions: number = 0) {
    super(reward, totalRedemptions);
  }
}
