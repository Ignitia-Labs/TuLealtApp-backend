import { ApiProperty } from '@nestjs/swagger';
import { Reward } from '@libs/domain';
import { CreateRewardResponse } from '../create-reward/create-reward.response';

/**
 * DTO de response para actualizar una recompensa
 */
export class UpdateRewardResponse extends CreateRewardResponse {
  constructor(reward: Reward) {
    super(reward);
  }
}
