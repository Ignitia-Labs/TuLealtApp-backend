import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRewardRepository, ITenantRepository, Reward } from '@libs/domain';
import {
  PartnerSubscriptionUsageEntity,
  PartnerSubscriptionEntity,
  RewardEntity,
} from '@libs/infrastructure';
import { SubscriptionUsageHelper } from '@libs/application/subscription-usage/subscription-usage.helper';
import { CreateRewardRequest } from './create-reward.request';
import { CreateRewardResponse } from './create-reward.response';

/**
 * Handler para crear una nueva recompensa
 */
@Injectable()
export class CreateRewardHandler {
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

  async execute(request: CreateRewardRequest): Promise<CreateRewardResponse> {
    // Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Crear recompensa usando el factory method del dominio
    const reward = Reward.create(
      request.tenantId,
      request.name,
      request.pointsRequired,
      request.stock,
      request.category,
      request.description || null,
      request.image || null,
      request.maxRedemptionsPerUser || null,
      request.status || 'draft',
      request.terms || null,
      request.validUntil ? new Date(request.validUntil) : null,
    );

    // Guardar en el repositorio
    const savedReward = await this.rewardRepository.save(reward);

    // Actualizar el conteo de rewards en partner_subscription_usage
    // Solo si la reward está activa
    if (savedReward.status === 'active') {
      await SubscriptionUsageHelper.recalculateRewardsCountForTenant(
        request.tenantId,
        this.usageRepository,
        this.subscriptionRepository,
        this.tenantRepository,
        this.rewardEntityRepository,
      );
    }

    return new CreateRewardResponse(savedReward);
  }
}
