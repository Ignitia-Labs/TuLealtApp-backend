import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IRewardRepository, Reward } from '@libs/domain';
import { CreateRewardRequest } from './create-reward.request';
import { CreateRewardResponse } from './create-reward.response';
import { SubscriptionUsageHelper } from '@libs/application';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PartnerSubscriptionUsageEntity,
  PartnerSubscriptionEntity,
} from '@libs/infrastructure';
import { ITenantRepository } from '@libs/domain';

/**
 * Handler para el caso de uso de crear una recompensa
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
  ) {}

  async execute(request: CreateRewardRequest): Promise<CreateRewardResponse> {
    // Crear la entidad de dominio
    const reward = Reward.create(
      request.tenantId,
      request.name,
      request.description,
      request.pointsRequired,
      request.stock,
      request.category,
      request.image || null,
      request.maxRedemptionsPerUser || null,
      request.terms || null,
      request.validUntil ? new Date(request.validUntil) : null,
    );

    // Guardar usando el repositorio
    const savedReward = await this.rewardRepository.save(reward);

    // Incrementar el contador de rewards en el uso de suscripción
    const subscriptionId = await SubscriptionUsageHelper.getSubscriptionIdFromTenantId(
      savedReward.tenantId,
      this.tenantRepository,
      this.subscriptionRepository,
    );
    if (subscriptionId) {
      await SubscriptionUsageHelper.incrementRewardsCount(
        subscriptionId,
        this.usageRepository,
      );
    }

    // Retornar response DTO
    return new CreateRewardResponse(
      savedReward.id,
      savedReward.tenantId,
      savedReward.name,
      savedReward.description,
      savedReward.image,
      savedReward.pointsRequired,
      savedReward.stock,
      savedReward.maxRedemptionsPerUser,
      savedReward.status,
      savedReward.category,
      savedReward.terms,
      savedReward.validUntil,
      savedReward.createdAt,
      savedReward.updatedAt,
    );
  }
}
