import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPartnerRequestRepository } from '@libs/domain';
import { GetPartnerRequestRequest } from './get-partner-request.request';
import { GetPartnerRequestResponse } from './get-partner-request.response';

/**
 * Handler para el caso de uso de obtener una solicitud de partner por ID
 */
@Injectable()
export class GetPartnerRequestHandler {
  constructor(
    @Inject('IPartnerRequestRepository')
    private readonly partnerRequestRepository: IPartnerRequestRepository,
  ) {}

  async execute(request: GetPartnerRequestRequest): Promise<GetPartnerRequestResponse> {
    const partnerRequest = await this.partnerRequestRepository.findById(request.id);

    if (!partnerRequest) {
      throw new NotFoundException(`Partner request with ID ${request.id} not found`);
    }

    return new GetPartnerRequestResponse(partnerRequest);
  }
}
