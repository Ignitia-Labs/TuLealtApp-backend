import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IRewardRepository, Reward } from '@libs/domain';
import { CreateRewardRequest } from './create-reward.request';
import { CreateRewardResponse } from './create-reward.response';

/**
 * Handler para el caso de uso de crear una recompensa
 */
@Injectable()
export class CreateRewardHandler {
  constructor(
    @Inject('IRewardRepository')
    private readonly rewardRepository: IRewardRepository,
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
