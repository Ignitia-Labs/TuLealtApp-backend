import { Injectable, Inject } from '@nestjs/common';
import { IRewardRepository } from '@libs/domain';
import { GetRewardsRequest } from './get-rewards.request';
import { GetRewardsResponse } from './get-rewards.response';

/**
 * Handler para obtener todas las recompensas de un tenant
 */
@Injectable()
export class GetRewardsHandler {
  constructor(
    @Inject('IRewardRepository')
    private readonly rewardRepository: IRewardRepository,
  ) {}

  async execute(request: GetRewardsRequest): Promise<GetRewardsResponse> {
    const rewards = await this.rewardRepository.findByTenantId(request.tenantId);
    return new GetRewardsResponse(rewards);
  }
}
