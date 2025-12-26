import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPartnerRequestRepository } from '@libs/domain';
import { RejectPartnerRequestRequest } from './reject-partner-request.request';
import { RejectPartnerRequestResponse } from './reject-partner-request.response';

/**
 * Handler para el caso de uso de rechazar una solicitud de partner
 */
@Injectable()
export class RejectPartnerRequestHandler {
  constructor(
    @Inject('IPartnerRequestRepository')
    private readonly partnerRequestRepository: IPartnerRequestRepository,
  ) {}

  async execute(request: RejectPartnerRequestRequest): Promise<RejectPartnerRequestResponse> {
    const partnerRequest = await this.partnerRequestRepository.findById(request.requestId);

    if (!partnerRequest) {
      throw new NotFoundException(`Partner request with ID ${request.requestId} not found`);
    }

    if (partnerRequest.status === 'enrolled') {
      throw new BadRequestException('No se puede rechazar una solicitud ya inscrita');
    }

    if (partnerRequest.status === 'rejected') {
      throw new BadRequestException('La solicitud ya está rechazada');
    }

    const rejectedRequest = partnerRequest.reject();
    const savedRequest = await this.partnerRequestRepository.update(rejectedRequest);

    return new RejectPartnerRequestResponse(
      savedRequest.id,
      savedRequest.status,
      savedRequest.lastUpdated,
    );
  }
}
