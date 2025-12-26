import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPartnerRequestRepository, PartnerRequest } from '@libs/domain';
import { UpdatePartnerRequestStatusRequest } from './update-partner-request-status.request';
import { UpdatePartnerRequestStatusResponse } from './update-partner-request-status.response';

/**
 * Handler para el caso de uso de actualizar el estado de una solicitud de partner
 */
@Injectable()
export class UpdatePartnerRequestStatusHandler {
  constructor(
    @Inject('IPartnerRequestRepository')
    private readonly partnerRequestRepository: IPartnerRequestRepository,
  ) {}

  async execute(
    request: UpdatePartnerRequestStatusRequest,
  ): Promise<UpdatePartnerRequestStatusResponse> {
    const partnerRequest = await this.partnerRequestRepository.findById(request.requestId);

    if (!partnerRequest) {
      throw new NotFoundException(`Partner request with ID ${request.requestId} not found`);
    }

    // Validar transiciones de estado
    if (partnerRequest.status === 'enrolled' && request.status !== 'enrolled') {
      throw new BadRequestException('No se puede cambiar el estado de una solicitud ya inscrita');
    }

    if (partnerRequest.status === 'rejected' && request.status !== 'rejected') {
      throw new BadRequestException('No se puede cambiar el estado de una solicitud rechazada');
    }

    let updatedRequest;

    switch (request.status) {
      case 'in-progress':
        if (!request.assignedTo) {
          throw new BadRequestException(
            'El campo assignedTo es requerido cuando el estado es in-progress',
          );
        }
        updatedRequest = partnerRequest.markInProgress(request.assignedTo);
        break;
      case 'enrolled':
        updatedRequest = partnerRequest.markEnrolled();
        break;
      case 'rejected':
        updatedRequest = partnerRequest.reject();
        break;
      case 'pending':
        // Para volver a pending, creamos una nueva instancia con el estado pending
        updatedRequest = PartnerRequest.create(
          partnerRequest.name,
          partnerRequest.responsibleName,
          partnerRequest.email,
          partnerRequest.phone,
          partnerRequest.countryId,
          partnerRequest.city,
          partnerRequest.plan,
          partnerRequest.category,
          partnerRequest.rewardType,
          partnerRequest.currencyId,
          partnerRequest.businessName,
          partnerRequest.taxId,
          partnerRequest.fiscalAddress,
          partnerRequest.paymentMethod,
          partnerRequest.billingEmail,
          partnerRequest.branchesNumber,
          partnerRequest.logo,
          partnerRequest.website,
          partnerRequest.socialMedia,
          partnerRequest.notes,
          'pending',
          null,
          partnerRequest.submittedAt,
          partnerRequest.id,
        );
        break;
      default:
        throw new BadRequestException(`Estado inválido: ${request.status}`);
    }

    const savedRequest = await this.partnerRequestRepository.update(updatedRequest);

    return new UpdatePartnerRequestStatusResponse(
      savedRequest.id,
      savedRequest.status,
      savedRequest.assignedTo,
      savedRequest.lastUpdated,
    );
  }
}
