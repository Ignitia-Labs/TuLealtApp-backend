import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IRewardRepository } from '@libs/domain';
import { DeleteRewardRequest } from './delete-reward.request';
import { DeleteRewardResponse } from './delete-reward.response';

/**
 * Handler para el caso de uso de eliminar una recompensa
 */
@Injectable()
export class DeleteRewardHandler {
  constructor(
    @Inject('IRewardRepository')
    private readonly rewardRepository: IRewardRepository,
  ) {}

  async execute(request: DeleteRewardRequest): Promise<DeleteRewardResponse> {
    // Verificar que la recompensa existe
    const reward = await this.rewardRepository.findById(request.rewardId);

    if (!reward) {
      throw new NotFoundException(`Reward with ID ${request.rewardId} not found`);
    }

    // Eliminar la recompensa
    await this.rewardRepository.delete(request.rewardId);

    return new DeleteRewardResponse('Reward deleted successfully', request.rewardId);
  }
}

