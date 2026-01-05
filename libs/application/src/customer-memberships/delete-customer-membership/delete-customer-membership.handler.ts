import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ICustomerMembershipRepository } from '@libs/domain';
import { DeleteCustomerMembershipRequest } from './delete-customer-membership.request';
import { DeleteCustomerMembershipResponse } from './delete-customer-membership.response';

/**
 * Handler para el caso de uso de eliminar una membership
 */
@Injectable()
export class DeleteCustomerMembershipHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
  ) {}

  async execute(
    request: DeleteCustomerMembershipRequest,
  ): Promise<DeleteCustomerMembershipResponse> {
    // Verificar que la membership existe
    const membership = await this.membershipRepository.findById(request.membershipId);

    if (!membership) {
      throw new NotFoundException(`Membership with ID ${request.membershipId} not found`);
    }

    // Eliminar la membership
    await this.membershipRepository.delete(request.membershipId);

    return new DeleteCustomerMembershipResponse(request.membershipId);
  }
}
