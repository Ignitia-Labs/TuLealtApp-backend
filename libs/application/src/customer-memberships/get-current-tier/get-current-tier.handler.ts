import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  ICustomerTierRepository,
  ITierStatusRepository,
} from '@libs/domain';
import { GetCurrentTierRequest } from './get-current-tier.request';
import { GetCurrentTierResponse } from './get-current-tier.response';

/**
 * Handler para obtener el tier actual de una membership
 */
@Injectable()
export class GetCurrentTierHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('ICustomerTierRepository')
    private readonly tierRepository: ICustomerTierRepository,
    @Inject('ITierStatusRepository')
    private readonly tierStatusRepository: ITierStatusRepository,
  ) {}

  async execute(request: GetCurrentTierRequest, userId: number): Promise<GetCurrentTierResponse> {
    // Obtener membership y validar ownership
    const membership = await this.membershipRepository.findById(request.membershipId);
    if (!membership) {
      throw new NotFoundException(`Membership with ID ${request.membershipId} not found`);
    }

    // Validar que la membership pertenece al usuario
    if (membership.userId !== userId) {
      throw new NotFoundException(
        `Membership ${request.membershipId} does not belong to user ${userId}`,
      );
    }

    // Obtener tier actual (usar tierId de membership o calcular por puntos)
    let currentTier = null;
    if (membership.tierId) {
      currentTier = await this.tierRepository.findById(membership.tierId);
    }

    // Si no hay tier asignado o el tier no existe, buscar por puntos
    if (!currentTier) {
      currentTier = await this.tierRepository.findByPoints(membership.tenantId, membership.points);
    }

    // Obtener siguiente tier
    const allTiers = await this.tierRepository.findActiveByTenantId(membership.tenantId);
    const sortedTiers = allTiers.sort((a, b) => a.priority - b.priority);

    let nextTier: any = null;
    if (currentTier) {
      // Encontrar el siguiente tier con mayor prioridad
      const currentIndex = sortedTiers.findIndex((t) => t.id === currentTier!.id);
      if (currentIndex >= 0 && currentIndex < sortedTiers.length - 1) {
        nextTier = sortedTiers[currentIndex + 1];
      }
    } else if (sortedTiers.length > 0) {
      // Si no tiene tier, el siguiente es el primero
      nextTier = sortedTiers[0];
    }

    // Obtener tier status
    const tierStatus = await this.tierStatusRepository.findByMembershipId(request.membershipId);

    return new GetCurrentTierResponse(membership, currentTier, nextTier, tierStatus);
  }
}
