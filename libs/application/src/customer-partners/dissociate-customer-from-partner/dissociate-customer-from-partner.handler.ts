import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ICustomerPartnerRepository } from '@libs/domain';
import { DissociateCustomerFromPartnerRequest } from './dissociate-customer-from-partner.request';
import { DissociateCustomerFromPartnerResponse } from './dissociate-customer-from-partner.response';

/**
 * Handler para el caso de uso de desasociar un customer de un partner
 * Realiza soft delete: desactiva la asociación en lugar de eliminarla físicamente
 */
@Injectable()
export class DissociateCustomerFromPartnerHandler {
  constructor(
    @Inject('ICustomerPartnerRepository')
    private readonly customerPartnerRepository: ICustomerPartnerRepository,
  ) {}

  async execute(
    request: DissociateCustomerFromPartnerRequest,
  ): Promise<DissociateCustomerFromPartnerResponse> {
    // Buscar la asociación existente
    const association = await this.customerPartnerRepository.findById(request.associationId);

    if (!association) {
      throw new NotFoundException(
        `CustomerPartner association with ID ${request.associationId} not found`,
      );
    }

    // Verificar si ya está desactivada
    if (association.status === 'inactive') {
      throw new Error(
        `Association with ID ${request.associationId} is already dissociated (inactive)`,
      );
    }

    // Desactivar la asociación (soft delete)
    const deactivatedAssociation = association.deactivate();
    await this.customerPartnerRepository.update(deactivatedAssociation);

    return new DissociateCustomerFromPartnerResponse(
      'Customer successfully dissociated from partner',
      request.associationId,
    );
  }
}
