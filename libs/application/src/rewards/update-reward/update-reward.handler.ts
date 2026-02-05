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
import { UpdateRewardRequest } from './update-reward.request';
import { UpdateRewardResponse } from './update-reward.response';

/**
 * Handler para actualizar una recompensa
 */
@Injectable()
export class UpdateRewardHandler {
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

  async execute(request: UpdateRewardRequest): Promise<UpdateRewardResponse> {
    if (!request.rewardId) {
      throw new NotFoundException('Reward ID is required');
    }

    // Obtener recompensa existente
    const existingReward = await this.rewardRepository.findById(request.rewardId);
    if (!existingReward) {
      throw new NotFoundException(`Reward with ID ${request.rewardId} not found`);
    }

    // Validar tenant si se proporciona
    if (request.tenantId && existingReward.tenantId !== request.tenantId) {
      throw new NotFoundException(
        `Reward ${request.rewardId} does not belong to tenant ${request.tenantId}`,
      );
    }

    // Aplicar actualizaciones usando métodos inmutables del dominio
    let updatedReward = existingReward;

    if (request.name !== undefined) {
      updatedReward = Reward.create(
        updatedReward.tenantId,
        request.name,
        updatedReward.pointsRequired,
        updatedReward.stock,
        updatedReward.category,
        updatedReward.description,
        updatedReward.image,
        updatedReward.maxRedemptionsPerUser,
        updatedReward.status,
        updatedReward.terms,
        updatedReward.validUntil,
        updatedReward.id,
      );
    }

    if (request.pointsRequired !== undefined) {
      updatedReward = updatedReward.updatePointsRequired(request.pointsRequired);
    }

    if (request.stock !== undefined) {
      // Si el nuevo stock es -1 (ilimitado) o diferente al actual, establecer directamente
      if (request.stock === -1 || request.stock !== updatedReward.stock) {
        // Crear nueva instancia con el stock especificado directamente
        updatedReward = Reward.create(
          updatedReward.tenantId,
          updatedReward.name,
          updatedReward.pointsRequired,
          request.stock,
          updatedReward.category,
          updatedReward.description,
          updatedReward.image,
          updatedReward.maxRedemptionsPerUser,
          updatedReward.status,
          updatedReward.terms,
          updatedReward.validUntil,
          updatedReward.id,
        );
      }
    }

    if (request.status !== undefined) {
      if (request.status === 'active') {
        updatedReward = updatedReward.activate();
      } else if (request.status === 'inactive') {
        updatedReward = updatedReward.deactivate();
      } else {
        // Para 'draft' o 'expired', crear nueva instancia
        updatedReward = Reward.create(
          updatedReward.tenantId,
          updatedReward.name,
          updatedReward.pointsRequired,
          updatedReward.stock,
          updatedReward.category,
          updatedReward.description,
          updatedReward.image,
          updatedReward.maxRedemptionsPerUser,
          request.status,
          updatedReward.terms,
          updatedReward.validUntil,
          updatedReward.id,
        );
      }
    }

    // Actualizar campos simples creando nueva instancia
    if (
      request.description !== undefined ||
      request.image !== undefined ||
      request.maxRedemptionsPerUser !== undefined ||
      request.category !== undefined ||
      request.terms !== undefined ||
      request.validUntil !== undefined
    ) {
      updatedReward = Reward.create(
        updatedReward.tenantId,
        updatedReward.name,
        updatedReward.pointsRequired,
        updatedReward.stock,
        request.category !== undefined ? request.category : updatedReward.category,
        request.description !== undefined ? request.description : updatedReward.description,
        request.image !== undefined ? request.image : updatedReward.image,
        request.maxRedemptionsPerUser !== undefined
          ? request.maxRedemptionsPerUser
          : updatedReward.maxRedemptionsPerUser,
        updatedReward.status,
        request.terms !== undefined ? request.terms : updatedReward.terms,
        request.validUntil !== undefined
          ? request.validUntil
            ? new Date(request.validUntil)
            : null
          : updatedReward.validUntil,
        updatedReward.id,
      );
    }

    // Guardar cambios
    const savedReward = await this.rewardRepository.update(updatedReward);

    // Actualizar el conteo de rewards en partner_subscription_usage
    // Solo si cambió el status (de activa a inactiva o viceversa)
    const statusChanged = existingReward.status !== savedReward.status;
    if (statusChanged || savedReward.status === 'active') {
      await SubscriptionUsageHelper.recalculateRewardsCountForTenant(
        savedReward.tenantId,
        this.usageRepository,
        this.subscriptionRepository,
        this.tenantRepository,
        this.rewardEntityRepository,
      );
    }

    return new UpdateRewardResponse(savedReward);
  }
}
