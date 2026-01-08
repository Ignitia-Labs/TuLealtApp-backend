import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IPartnerRequestRepository, PartnerRequest } from '@libs/domain';
import { CreatePartnerRequestRequest } from './create-partner-request.request';
import { CreatePartnerRequestResponse } from './create-partner-request.response';

/**
 * Handler para el caso de uso de crear una solicitud de partner
 */
@Injectable()
export class CreatePartnerRequestHandler {
  constructor(
    @Inject('IPartnerRequestRepository')
    private readonly partnerRequestRepository: IPartnerRequestRepository,
  ) {}

  async execute(
    request: CreatePartnerRequestRequest,
    source: 'public' | 'internal' = 'internal',
  ): Promise<CreatePartnerRequestResponse> {
    // Validar que el email no exista en otra solicitud pendiente o en progreso
    const existingRequests = await this.partnerRequestRepository.findAll();
    const existingRequestByEmail = existingRequests.find(
      (r) => r.email === request.email && (r.status === 'pending' || r.status === 'in-progress'),
    );

    if (existingRequestByEmail) {
      throw new BadRequestException(
        'Ya existe una solicitud pendiente o en progreso con este email',
      );
    }

    // Crear la entidad de dominio
    const partnerRequest = PartnerRequest.create(
      request.name,
      request.responsibleName,
      request.email,
      request.phone,
      request.countryId || null,
      request.city,
      request.plan,
      request.category,
      request.rewardType,
      request.currencyId,
      request.businessName,
      request.taxId,
      request.fiscalAddress,
      request.paymentMethod,
      request.billingEmail,
      request.branchesNumber || 0,
      request.logo || null,
      request.website || null,
      request.socialMedia || null,
      request.notes || null,
      'pending',
      null,
      new Date(),
      request.planId || null,
      request.billingFrequency || null,
      request.subscriptionCurrencyId || null,
      source,
    );

    // Guardar la solicitud
    const savedRequest = await this.partnerRequestRepository.save(partnerRequest);

    return new CreatePartnerRequestResponse(
      savedRequest.id,
      savedRequest.status,
      savedRequest.submittedAt,
      savedRequest.name,
      savedRequest.email,
    );
  }
}
