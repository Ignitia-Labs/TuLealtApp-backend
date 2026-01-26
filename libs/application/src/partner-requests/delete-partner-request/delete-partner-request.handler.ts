import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPartnerRequestRepository } from '@libs/domain';
import { DeletePartnerRequestRequest } from './delete-partner-request.request';
import { DeletePartnerRequestResponse } from './delete-partner-request.response';

/**
 * Handler para el caso de uso de eliminar una solicitud de partner
 */
@Injectable()
export class DeletePartnerRequestHandler {
  constructor(
    @Inject('IPartnerRequestRepository')
    private readonly partnerRequestRepository: IPartnerRequestRepository,
  ) {}

  async execute(
    request: DeletePartnerRequestRequest,
  ): Promise<DeletePartnerRequestResponse> {
    // Verificar que la solicitud exista
    const existingRequest = await this.partnerRequestRepository.findById(
      request.requestId,
    );

    if (!existingRequest) {
      throw new NotFoundException(
        `Partner request with ID ${request.requestId} not found`,
      );
    }

    // Eliminar la solicitud
    await this.partnerRequestRepository.delete(request.requestId);

    return new DeletePartnerRequestResponse(
      'Partner request deleted successfully',
      request.requestId,
    );
  }
}
