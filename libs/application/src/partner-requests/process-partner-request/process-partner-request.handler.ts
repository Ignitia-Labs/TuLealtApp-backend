import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPartnerRequestRepository, IPartnerRepository } from '@libs/domain';
import { CreatePartnerHandler } from '../../partners/create-partner/create-partner.handler';
import { CreatePartnerRequest } from '../../partners/create-partner/create-partner.request';
import { ProcessPartnerRequestRequest } from './process-partner-request.request';
import { ProcessPartnerRequestResponse } from './process-partner-request.response';

/**
 * Handler para el caso de uso de procesar una solicitud de partner (convertirla en partner)
 */
@Injectable()
export class ProcessPartnerRequestHandler {
  constructor(
    @Inject('IPartnerRequestRepository')
    private readonly partnerRequestRepository: IPartnerRequestRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    private readonly createPartnerHandler: CreatePartnerHandler,
  ) {}

  async execute(request: ProcessPartnerRequestRequest): Promise<ProcessPartnerRequestResponse> {
    // Obtener la solicitud
    const partnerRequest = await this.partnerRequestRepository.findById(request.requestId);

    if (!partnerRequest) {
      throw new NotFoundException(`Partner request with ID ${request.requestId} not found`);
    }

    if (partnerRequest.status === 'enrolled') {
      throw new BadRequestException('La solicitud ya ha sido procesada');
    }

    if (partnerRequest.status === 'rejected') {
      throw new BadRequestException('No se puede procesar una solicitud rechazada');
    }

    // Usar directamente el countryId del partnerRequest
    const countryId = partnerRequest.countryId;

    // Generar dominio si no se proporciona
    const domain =
      request.domain ||
      partnerRequest.email.split('@')[1] ||
      `${partnerRequest.name.toLowerCase().replace(/\s+/g, '-')}.gt`;

    // Validar que el dominio no exista
    const existingPartnerByDomain = await this.partnerRepository.findByDomain(domain);
    if (existingPartnerByDomain) {
      throw new BadRequestException(`Ya existe un partner con el dominio: ${domain}`);
    }

    // Crear el DTO para crear el partner
    const createPartnerRequest = new CreatePartnerRequest();
    createPartnerRequest.name = partnerRequest.name;
    createPartnerRequest.responsibleName = partnerRequest.responsibleName;
    createPartnerRequest.email = partnerRequest.email;
    createPartnerRequest.phone = partnerRequest.phone;
    createPartnerRequest.countryId = countryId;
    createPartnerRequest.city = partnerRequest.city;
    createPartnerRequest.plan = partnerRequest.plan;
    createPartnerRequest.logo = partnerRequest.logo;
    createPartnerRequest.category = partnerRequest.category;
    createPartnerRequest.branchesNumber = partnerRequest.branchesNumber;
    createPartnerRequest.website = partnerRequest.website;
    createPartnerRequest.socialMedia = partnerRequest.socialMedia;
    createPartnerRequest.rewardType = partnerRequest.rewardType;
    createPartnerRequest.currencyId = partnerRequest.currencyId;
    createPartnerRequest.businessName = partnerRequest.businessName;
    createPartnerRequest.taxId = partnerRequest.taxId;
    createPartnerRequest.fiscalAddress = partnerRequest.fiscalAddress;
    createPartnerRequest.paymentMethod = partnerRequest.paymentMethod;
    createPartnerRequest.billingEmail = partnerRequest.billingEmail;
    createPartnerRequest.domain = domain;
    createPartnerRequest.subscriptionPlanId =
      request.subscriptionPlanId || `plan-${partnerRequest.plan}`;
    createPartnerRequest.subscriptionStartDate =
      request.subscriptionStartDate || new Date().toISOString();
    createPartnerRequest.subscriptionRenewalDate =
      request.subscriptionRenewalDate ||
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 año desde ahora
    createPartnerRequest.subscriptionLastPaymentAmount = request.subscriptionLastPaymentAmount || 0;
    createPartnerRequest.subscriptionAutoRenew =
      request.subscriptionAutoRenew !== undefined ? request.subscriptionAutoRenew : true;
    createPartnerRequest.limitsMaxTenants = request.limitsMaxTenants || 5;
    createPartnerRequest.limitsMaxBranches = request.limitsMaxBranches || 20;
    createPartnerRequest.limitsMaxCustomers = request.limitsMaxCustomers || 5000;
    createPartnerRequest.limitsMaxRewards = request.limitsMaxRewards || 50;

    // Crear el partner
    const createPartnerResponse = await this.createPartnerHandler.execute(createPartnerRequest);

    // Marcar la solicitud como enrolled
    const enrolledRequest = partnerRequest.markEnrolled();
    await this.partnerRequestRepository.update(enrolledRequest);

    return new ProcessPartnerRequestResponse(
      createPartnerResponse.id,
      partnerRequest.id,
      'enrolled',
      createPartnerResponse.name,
      createPartnerResponse.email,
      createPartnerResponse.domain,
    );
  }
}
