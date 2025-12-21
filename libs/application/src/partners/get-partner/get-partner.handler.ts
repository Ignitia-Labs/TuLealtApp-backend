import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPartnerRepository } from '@libs/domain';
import { GetPartnerRequest } from './get-partner.request';
import { GetPartnerResponse } from './get-partner.response';

/**
 * Handler para el caso de uso de obtener un partner por ID
 */
@Injectable()
export class GetPartnerHandler {
  constructor(
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
  ) {}

  async execute(request: GetPartnerRequest): Promise<GetPartnerResponse> {
    const partner = await this.partnerRepository.findById(request.partnerId);

    if (!partner) {
      throw new NotFoundException(
        `Partner with ID ${request.partnerId} not found`,
      );
    }

    return new GetPartnerResponse(
      partner.id,
      partner.name,
      partner.responsibleName,
      partner.email,
      partner.phone,
      partner.country,
      partner.city,
      partner.plan,
      partner.logo,
      partner.category,
      partner.branchesNumber,
      partner.website,
      partner.socialMedia,
      partner.rewardType,
      partner.currencyId,
      partner.businessName,
      partner.taxId,
      partner.fiscalAddress,
      partner.paymentMethod,
      partner.billingEmail,
      partner.domain,
      partner.status,
      partner.createdAt,
      partner.updatedAt,
    );
  }
}
