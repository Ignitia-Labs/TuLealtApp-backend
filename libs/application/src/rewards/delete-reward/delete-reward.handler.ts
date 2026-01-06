import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IRewardRepository } from '@libs/domain';
import { DeleteRewardRequest } from './delete-reward.request';
import { DeleteRewardResponse } from './delete-reward.response';
import { SubscriptionUsageHelper } from '@libs/application';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PartnerSubscriptionUsageEntity,
  PartnerSubscriptionEntity,
} from '@libs/infrastructure';
import { ITenantRepository } from '@libs/domain';

/**
 * Handler para el caso de uso de eliminar una recompensa
 */
@Injectable()
export class DeleteRewardHandler {
  constructor(
    @Inject('IRewardRepository')
    private readonly rewardRepository: IRewardRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @InjectRepository(PartnerSubscriptionUsageEntity)
    private readonly usageRepository: Repository<PartnerSubscriptionUsageEntity>,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
  ) {}

  async execute(request: DeleteRewardRequest): Promise<DeleteRewardResponse> {
    // Verificar que la recompensa existe
    const reward = await this.rewardRepository.findById(request.rewardId);

    if (!reward) {
      throw new NotFoundException(`Reward with ID ${request.rewardId} not found`);
    }

    // Obtener el tenantId antes de eliminar para obtener el subscriptionId
    const tenantId = reward.tenantId;
    const subscriptionId = await SubscriptionUsageHelper.getSubscriptionIdFromTenantId(
      tenantId,
      this.tenantRepository,
      this.subscriptionRepository,
    );

    // Eliminar la recompensa
    await this.rewardRepository.delete(request.rewardId);

    // Decrementar el contador de rewards en el uso de suscripción
    if (subscriptionId) {
      await SubscriptionUsageHelper.decrementRewardsCount(
        subscriptionId,
        this.usageRepository,
      );
    }

    return new DeleteRewardResponse('Reward deleted successfully', request.rewardId);
  }
}

