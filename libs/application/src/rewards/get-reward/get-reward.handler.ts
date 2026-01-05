import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IRewardRepository } from '@libs/domain';
import { GetRewardRequest } from './get-reward.request';
import { GetRewardResponse } from './get-reward.response';

/**
 * Handler para el caso de uso de obtener una recompensa por ID
 */
@Injectable()
export class GetRewardHandler {
  constructor(
    @Inject('IRewardRepository')
    private readonly rewardRepository: IRewardRepository,
  ) {}

  async execute(request: GetRewardRequest): Promise<GetRewardResponse> {
    const reward = await this.rewardRepository.findById(request.rewardId);

    if (!reward) {
      throw new NotFoundException(`Reward with ID ${request.rewardId} not found`);
    }

    return new GetRewardResponse(
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
    );
  }
}
