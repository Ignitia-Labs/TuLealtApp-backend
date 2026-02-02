import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IRewardRepository, ICustomerMembershipRepository } from '@libs/domain';
import { GetAvailableRewardsRequest } from './get-available-rewards.request';
import { GetAvailableRewardsResponse } from './get-available-rewards.response';

/**
 * Handler para obtener recompensas disponibles para un cliente
 */
@Injectable()
export class GetAvailableRewardsHandler {
  constructor(
    @Inject('IRewardRepository')
    private readonly rewardRepository: IRewardRepository,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
  ) {}

  async execute(request: GetAvailableRewardsRequest): Promise<GetAvailableRewardsResponse> {
    // Obtener membership
    const membership = await this.membershipRepository.findById(request.membershipId);
    if (!membership) {
      throw new NotFoundException(`Membership with ID ${request.membershipId} not found`);
    }

    // Obtener recompensas disponibles del tenant
    const availableRewards = await this.rewardRepository.findAvailableByTenantId(
      membership.tenantId,
    );

    // Filtrar solo las que el cliente puede canjear (tiene puntos suficientes)
    const canRedeemRewards = availableRewards.filter((reward) =>
      reward.canRedeem(0, membership.points),
    );

    return new GetAvailableRewardsResponse(canRedeemRewards);
  }
}
