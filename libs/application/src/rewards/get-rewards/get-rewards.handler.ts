import { Injectable, Inject } from '@nestjs/common';
import { IRewardRepository } from '@libs/domain';
import { GetRewardsRequest } from './get-rewards.request';
import { GetRewardsResponse, RewardDto } from './get-rewards.response';

/**
 * Handler para el caso de uso de obtener recompensas
 */
@Injectable()
export class GetRewardsHandler {
  constructor(
    @Inject('IRewardRepository')
    private readonly rewardRepository: IRewardRepository,
  ) {}

  async execute(request: GetRewardsRequest): Promise<GetRewardsResponse> {
    let rewards;

    if (request.availableOnly) {
      rewards = await this.rewardRepository.findAvailable(request.tenantId);
    } else if (request.category) {
      rewards = await this.rewardRepository.findByCategory(request.tenantId, request.category);
    } else {
      rewards = await this.rewardRepository.findByTenantId(request.tenantId);
    }

    const rewardDtos: RewardDto[] = rewards.map(
      (reward) =>
        new RewardDto(
          reward.id,
          reward.tenantId,
          reward.name,
          reward.description,
          reward.image,
          reward.pointsRequired,
          reward.stock,
          reward.maxRedemptionsPerUser,
          reward.status,
          reward.category,
          reward.terms,
          reward.validUntil,
          reward.createdAt,
          reward.updatedAt,
        ),
    );

    return new GetRewardsResponse(rewardDtos);
  }
}

