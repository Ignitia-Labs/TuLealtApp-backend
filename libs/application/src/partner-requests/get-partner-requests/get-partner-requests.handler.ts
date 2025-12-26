import { Injectable, Inject } from '@nestjs/common';
import { IPartnerRequestRepository } from '@libs/domain';
import { GetPartnerRequestsRequest } from './get-partner-requests.request';
import { GetPartnerRequestsResponse } from './get-partner-requests.response';
import { GetPartnerRequestResponse } from '../get-partner-request/get-partner-request.response';

/**
 * Handler para el caso de uso de obtener todas las solicitudes de partners
 */
@Injectable()
export class GetPartnerRequestsHandler {
  constructor(
    @Inject('IPartnerRequestRepository')
    private readonly partnerRequestRepository: IPartnerRequestRepository,
  ) {}

  async execute(request: GetPartnerRequestsRequest): Promise<GetPartnerRequestsResponse> {
    const skip = request.skip || 0;
    const take = request.take || 100;

    let partnerRequests;
    let total: number;

    if (request.status) {
      partnerRequests = await this.partnerRequestRepository.findByStatus(request.status);
      total = partnerRequests.length;
      // Aplicar paginación manualmente
      partnerRequests = partnerRequests.slice(skip, skip + take);
    } else {
      partnerRequests = await this.partnerRequestRepository.findAll(skip, take);
      // Para obtener el total real, necesitaríamos un método count en el repositorio
      // Por ahora, usamos la longitud del array
      const allRequests = await this.partnerRequestRepository.findAll(0, 10000);
      total = allRequests.length;
    }

    const requests = partnerRequests.map(
      (pr) => new GetPartnerRequestResponse(pr),
    );

    return new GetPartnerRequestsResponse(requests, total);
  }
}
