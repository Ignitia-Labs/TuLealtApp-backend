import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ICustomerPartnerRepository } from '@libs/domain';
import { UpdateCustomerPartnerStatusRequest } from './update-customer-partner-status.request';
import { UpdateCustomerPartnerStatusResponse } from './update-customer-partner-status.response';

/**
 * Handler para el caso de uso de actualizar el status de una asociación customer-partner
 */
@Injectable()
export class UpdateCustomerPartnerStatusHandler {
  constructor(
    @Inject('ICustomerPartnerRepository')
    private readonly customerPartnerRepository: ICustomerPartnerRepository,
  ) {}

  async execute(
    request: UpdateCustomerPartnerStatusRequest,
  ): Promise<UpdateCustomerPartnerStatusResponse> {
    // Buscar la asociación existente
    const association = await this.customerPartnerRepository.findById(request.associationId);

    if (!association) {
      throw new NotFoundException(
        `CustomerPartner association with ID ${request.associationId} not found`,
      );
    }

    // Actualizar el status usando métodos de dominio
    let updatedAssociation;
    switch (request.status) {
      case 'active':
        updatedAssociation = association.activate();
        break;
      case 'inactive':
        updatedAssociation = association.deactivate();
        break;
      case 'suspended':
        updatedAssociation = association.suspend();
        break;
      default:
        throw new Error(`Invalid status: ${request.status}`);
    }

    // Guardar los cambios
    const savedAssociation = await this.customerPartnerRepository.update(updatedAssociation);

    // Retornar response DTO
    return new UpdateCustomerPartnerStatusResponse(
      savedAssociation.id,
      savedAssociation.userId,
      savedAssociation.partnerId,
      savedAssociation.status,
      savedAssociation.updatedAt,
    );
  }
}
