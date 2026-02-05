import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRewardRepository, ITenantRepository } from '@libs/domain';
import {
  PartnerSubscriptionUsageEntity,
  PartnerSubscriptionEntity,
  RewardEntity,
} from '@libs/infrastructure';
import { SubscriptionUsageHelper } from '@libs/application/subscription-usage/subscription-usage.helper';
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
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @InjectRepository(PartnerSubscriptionUsageEntity)
    private readonly usageRepository: Repository<PartnerSubscriptionUsageEntity>,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    @InjectRepository(RewardEntity)
    private readonly rewardEntityRepository: Repository<RewardEntity>,
  ) {}

  async execute(request: GetRewardsRequest): Promise<GetRewardsResponse> {
    const rewards = await this.rewardRepository.findByTenantId(request.tenantId);

    // Obtener conteos de redemptions en batch para todas las rewards
    const rewardIds = rewards.map((r) => r.id);
    const redemptionsCounts = await this.rewardRepository.countTotalRedemptionsBatch(rewardIds);

    // Actualizar el conteo de rewards en partner_subscription_usage
    await SubscriptionUsageHelper.recalculateRewardsCountForTenant(
      request.tenantId,
      this.usageRepository,
      this.subscriptionRepository,
      this.tenantRepository,
      this.rewardEntityRepository,
    );

    return new GetRewardsResponse(rewards, redemptionsCounts);
  }
}
