import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRewardRepository, ITenantRepository } from '@libs/domain';
import {
  PartnerSubscriptionUsageEntity,
  PartnerSubscriptionEntity,
  RewardEntity,
} from '@libs/infrastructure';
import { SubscriptionUsageHelper } from '@libs/application/subscription-usage/subscription-usage.helper';
import { DeleteRewardRequest } from './delete-reward.request';

/**
 * Handler para eliminar una recompensa
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
    @InjectRepository(RewardEntity)
    private readonly rewardEntityRepository: Repository<RewardEntity>,
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

    // Guardar tenantId antes de eliminar para actualizar el conteo
    const tenantId = reward.tenantId;
    const wasActive = reward.status === 'active';

    // Eliminar
    await this.rewardRepository.delete(request.rewardId);

    // Actualizar el conteo de rewards en partner_subscription_usage
    // Solo si la reward eliminada estaba activa
    if (wasActive) {
      await SubscriptionUsageHelper.recalculateRewardsCountForTenant(
        tenantId,
        this.usageRepository,
        this.subscriptionRepository,
        this.tenantRepository,
        this.rewardEntityRepository,
      );
    }
  }
}
