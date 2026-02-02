import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IRewardRepository, ITenantRepository, Reward } from '@libs/domain';
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

    return new CreateRewardResponse(savedReward);
  }
}
