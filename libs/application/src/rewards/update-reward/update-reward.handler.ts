import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IRewardRepository } from '@libs/domain';
import { UpdateRewardRequest } from './update-reward.request';
import { UpdateRewardResponse } from './update-reward.response';

/**
 * Handler para el caso de uso de actualizar una recompensa
 * Permite actualización parcial (PATCH) de todos los campos
 */
@Injectable()
export class UpdateRewardHandler {
  constructor(
    @Inject('IRewardRepository')
    private readonly rewardRepository: IRewardRepository,
  ) {}

  async execute(rewardId: number, request: UpdateRewardRequest): Promise<UpdateRewardResponse> {
    // Buscar la recompensa existente
    const existingReward = await this.rewardRepository.findById(rewardId);

    if (!existingReward) {
      throw new NotFoundException(`Reward with ID ${rewardId} not found`);
    }

    // Convertir validUntil de string a Date si se proporciona
    const validUntil =
      request.validUntil !== undefined
        ? request.validUntil
          ? new Date(request.validUntil)
          : null
        : existingReward.validUntil;

    // Actualizar la recompensa usando el método de dominio
    const updatedReward = existingReward.update(
      request.name,
      request.description,
      request.pointsRequired,
      request.stock,
      request.category,
      request.image,
      request.maxRedemptionsPerUser,
      request.status,
      request.terms,
      validUntil,
    );

    // Guardar los cambios
    const savedReward = await this.rewardRepository.update(updatedReward);

    // Retornar response DTO
    return new UpdateRewardResponse(
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

