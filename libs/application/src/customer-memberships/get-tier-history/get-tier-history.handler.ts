import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  ICustomerTierRepository,
  ITierStatusRepository,
} from '@libs/domain';
import { GetTierHistoryRequest } from './get-tier-history.request';
import { GetTierHistoryResponse } from './get-tier-history.response';

/**
 * Handler para obtener el historial de cambios de tier
 * Nota: Por ahora solo retorna el estado actual ya que no hay tabla de historial
 * Se puede mejorar agregando una tabla de historial de cambios de tier
 */
@Injectable()
export class GetTierHistoryHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('ICustomerTierRepository')
    private readonly tierRepository: ICustomerTierRepository,
    @Inject('ITierStatusRepository')
    private readonly tierStatusRepository: ITierStatusRepository,
  ) {}

  async execute(request: GetTierHistoryRequest, userId: number): Promise<GetTierHistoryResponse> {
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

    // Obtener tier status
    const tierStatus = await this.tierStatusRepository.findByMembershipId(request.membershipId);

    // Obtener tier actual si existe
    let currentTier = null;
    if (tierStatus?.currentTierId) {
      currentTier = await this.tierRepository.findById(tierStatus.currentTierId);
    }

    return new GetTierHistoryResponse(tierStatus, currentTier, membership.points);
  }
}
