import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IRewardRepository } from '@libs/domain';
import { GetRewardRequest } from './get-reward.request';
import { GetRewardResponse } from './get-reward.response';

/**
 * Handler para obtener una recompensa por ID
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

    // Validar que la recompensa pertenece al tenant
    if (reward.tenantId !== request.tenantId) {
      throw new NotFoundException(
        `Reward ${request.rewardId} does not belong to tenant ${request.tenantId}`,
      );
    }

    // Obtener conteo de redemptions globales
    const totalRedemptions = await this.rewardRepository.countTotalRedemptions(reward.id);

    return new GetRewardResponse(reward, totalRedemptions);
  }
}
