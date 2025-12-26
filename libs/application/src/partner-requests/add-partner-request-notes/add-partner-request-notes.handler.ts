import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPartnerRequestRepository } from '@libs/domain';
import { AddPartnerRequestNotesRequest } from './add-partner-request-notes.request';
import { AddPartnerRequestNotesResponse } from './add-partner-request-notes.response';

/**
 * Handler para el caso de uso de agregar notas a una solicitud de partner
 */
@Injectable()
export class AddPartnerRequestNotesHandler {
  constructor(
    @Inject('IPartnerRequestRepository')
    private readonly partnerRequestRepository: IPartnerRequestRepository,
  ) {}

  async execute(
    request: AddPartnerRequestNotesRequest,
  ): Promise<AddPartnerRequestNotesResponse> {
    const partnerRequest = await this.partnerRequestRepository.findById(request.requestId);

    if (!partnerRequest) {
      throw new NotFoundException(`Partner request with ID ${request.requestId} not found`);
    }

    const updatedRequest = partnerRequest.addNotes(request.notes);
    const savedRequest = await this.partnerRequestRepository.update(updatedRequest);

    return new AddPartnerRequestNotesResponse(
      savedRequest.id,
      savedRequest.notes,
      savedRequest.lastUpdated,
    );
  }
}
