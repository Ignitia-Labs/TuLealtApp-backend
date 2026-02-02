import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IRewardRepository, Reward } from '@libs/domain';
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
      // Calcular diferencia de stock
      const stockDiff = request.stock - updatedReward.stock;
      if (stockDiff > 0) {
        updatedReward = updatedReward.increaseStock(stockDiff);
      } else if (stockDiff < 0) {
        // Reducir stock múltiples veces
        for (let i = 0; i < Math.abs(stockDiff); i++) {
          updatedReward = updatedReward.reduceStock();
        }
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

    return new UpdateRewardResponse(savedReward);
  }
}
