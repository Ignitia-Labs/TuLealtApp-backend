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
        // Si se proporciona assignedTo, lo usa; si no, mantiene el actual o null
        updatedRequest = partnerRequest.markInProgress(request.assignedTo);
        break;
      case 'enrolled':
        updatedRequest = partnerRequest.markEnrolled();
        break;
      case 'rejected':
        updatedRequest = partnerRequest.reject();
        break;
      case 'pending':
        // Usar el método de dominio para marcar como pending, preservando todos los campos
        updatedRequest = partnerRequest.markPending();
        break;
      default:
        throw new BadRequestException(`Estado inválido: ${request.status}`);
    }

    // Actualizar la solicitud existente (no crear una nueva)
    const savedRequest = await this.partnerRequestRepository.update(updatedRequest);

    return new UpdatePartnerRequestStatusResponse(
      savedRequest.id,
      savedRequest.status,
      savedRequest.assignedTo,
      savedRequest.lastUpdated,
    );
  }
}
