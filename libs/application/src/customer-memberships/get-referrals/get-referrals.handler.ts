import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ICustomerMembershipRepository, IReferralRepository } from '@libs/domain';
import { GetReferralsRequest } from './get-referrals.request';
import { GetReferralsResponse } from './get-referrals.response';

/**
 * Handler para obtener la lista de referidos de una membership
 */
@Injectable()
export class GetReferralsHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('IReferralRepository')
    private readonly referralRepository: IReferralRepository,
  ) {}

  async execute(request: GetReferralsRequest, userId: number): Promise<GetReferralsResponse> {
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

    // Obtener todos los referrals del referrer
    const referrals = await this.referralRepository.findByReferrer(
      request.membershipId,
      membership.tenantId,
    );

    // Ordenar por fecha descendente (más recientes primero)
    referrals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return new GetReferralsResponse(referrals);
  }
}
