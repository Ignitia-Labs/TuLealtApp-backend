import { ApiProperty } from '@nestjs/swagger';
import { Reward } from '@libs/domain';
import { CreateRewardResponse } from '../create-reward/create-reward.response';

/**
 * DTO de response para obtener recompensas
 */
export class GetRewardsResponse {
  @ApiProperty({
    description: 'Lista de recompensas',
    type: [CreateRewardResponse],
  })
  rewards: CreateRewardResponse[];

  constructor(rewards: Reward[]) {
    this.rewards = rewards.map((reward) => new CreateRewardResponse(reward));
  }
}
