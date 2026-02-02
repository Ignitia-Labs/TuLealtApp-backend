import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IRewardRepository } from '@libs/domain';
import { DeleteRewardRequest } from './delete-reward.request';

/**
 * Handler para eliminar una recompensa
 */
@Injectable()
export class DeleteRewardHandler {
  constructor(
    @Inject('IRewardRepository')
    private readonly rewardRepository: IRewardRepository,
  ) {}

  async execute(request: DeleteRewardRequest): Promise<void> {
    // Verificar que la recompensa existe y pertenece al tenant
    const reward = await this.rewardRepository.findById(request.rewardId);
    if (!reward) {
      throw new NotFoundException(`Reward with ID ${request.rewardId} not found`);
    }

    if (reward.tenantId !== request.tenantId) {
      throw new NotFoundException(
        `Reward ${request.rewardId} does not belong to tenant ${request.tenantId}`,
      );
    }

    // Eliminar
    await this.rewardRepository.delete(request.rewardId);
  }
}
