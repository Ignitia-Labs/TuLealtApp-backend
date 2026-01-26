import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPartnerRepository, Partner } from '@libs/domain';
import { UpdatePartnerRequest } from './update-partner.request';
import { UpdatePartnerResponse } from './update-partner.response';

/**
 * Handler para el caso de uso de actualizar un partner
 * Permite actualización parcial (PATCH) de todos los campos
 */
@Injectable()
export class UpdatePartnerHandler {
  constructor(
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
  ) {}

  async execute(partnerId: number, request: UpdatePartnerRequest): Promise<UpdatePartnerResponse> {
    // Buscar el partner existente
    const existingPartner = await this.partnerRepository.findById(partnerId);

    if (!existingPartner) {
      throw new NotFoundException(`Partner with ID ${partnerId} not found`);
    }

    // Crear partner actualizado con valores nuevos o existentes
    // Usar el constructor directamente para preservar createdAt y actualizar updatedAt
    const updatedPartner = new Partner(
      existingPartner.id,
      request.name ?? existingPartner.name,
      request.responsibleName ?? existingPartner.responsibleName,
      request.email ?? existingPartner.email,
      request.phone ?? existingPartner.phone,
      request.countryId !== undefined ? request.countryId : existingPartner.countryId,
      request.city ?? existingPartner.city,
      request.plan ?? existingPartner.plan,
      request.logo !== undefined ? request.logo : existingPartner.logo,
      request.banner !== undefined ? request.banner : existingPartner.banner,
      request.category ?? existingPartner.category,
      request.branchesNumber !== undefined
        ? request.branchesNumber
        : existingPartner.branchesNumber,
      request.website !== undefined ? request.website : existingPartner.website,
      request.socialMedia !== undefined ? request.socialMedia : existingPartner.socialMedia,
      request.rewardType ?? existingPartner.rewardType,
      request.currencyId ?? existingPartner.currencyId,
      request.businessName ?? existingPartner.businessName,
      request.taxId ?? existingPartner.taxId,
      request.fiscalAddress ?? existingPartner.fiscalAddress,
      request.paymentMethod ?? existingPartner.paymentMethod,
      request.billingEmail ?? existingPartner.billingEmail,
      request.domain ?? existingPartner.domain,
      existingPartner.quickSearchCode, // Preservar código de búsqueda rápida (no se puede modificar)
      request.status ?? existingPartner.status,
      existingPartner.createdAt, // Preservar fecha de creación
      new Date(), // Actualizar fecha de modificación
    );

    // Guardar el partner actualizado
    const savedPartner = await this.partnerRepository.update(updatedPartner);

    // Retornar response DTO
    return new UpdatePartnerResponse(
      savedPartner.id,
      savedPartner.name,
      savedPartner.responsibleName,
      savedPartner.email,
      savedPartner.phone,
      savedPartner.countryId,
      savedPartner.city,
      savedPartner.plan,
      savedPartner.logo,
      savedPartner.banner,
      savedPartner.category,
      savedPartner.branchesNumber,
      savedPartner.website,
      savedPartner.socialMedia,
      savedPartner.rewardType,
      savedPartner.currencyId,
      savedPartner.businessName,
      savedPartner.taxId,
      savedPartner.fiscalAddress,
      savedPartner.paymentMethod,
      savedPartner.billingEmail,
      savedPartner.domain,
      savedPartner.status,
      savedPartner.createdAt,
      savedPartner.updatedAt,
    );
  }
}
