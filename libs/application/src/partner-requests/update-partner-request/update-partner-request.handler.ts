import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPartnerRequestRepository } from '@libs/domain';
import { UpdatePartnerRequestRequest } from './update-partner-request.request';
import { UpdatePartnerRequestResponse } from './update-partner-request.response';

/**
 * Handler para actualizar una solicitud de partner
 */
@Injectable()
export class UpdatePartnerRequestHandler {
  constructor(
    @Inject('IPartnerRequestRepository')
    private readonly partnerRequestRepository: IPartnerRequestRepository,
  ) {}

  async execute(
    request: UpdatePartnerRequestRequest,
    updatedBy: number,
  ): Promise<UpdatePartnerRequestResponse> {
    // Buscar la solicitud existente
    const partnerRequest = await this.partnerRequestRepository.findById(
      request.requestId,
    );

    if (!partnerRequest) {
      throw new NotFoundException(
        `Partner request with ID ${request.requestId} not found`,
      );
    }

    // Preparar los campos a actualizar
    const fieldsToUpdate: {
      name?: string;
      responsibleName?: string;
      email?: string;
      phone?: string;
      countryId?: number | null;
      city?: string;
      plan?: string;
      planId?: number | null;
      category?: string;
      website?: string | null;
      socialMedia?: string | null;
    } = {};

    if (request.name !== undefined) {
      fieldsToUpdate.name = request.name;
    }
    if (request.responsibleName !== undefined) {
      fieldsToUpdate.responsibleName = request.responsibleName;
    }
    if (request.email !== undefined) {
      fieldsToUpdate.email = request.email;
    }
    if (request.phone !== undefined) {
      fieldsToUpdate.phone = request.phone;
    }
    if (request.countryId !== undefined) {
      fieldsToUpdate.countryId = request.countryId;
    }
    if (request.city !== undefined) {
      fieldsToUpdate.city = request.city;
    }
    if (request.plan !== undefined) {
      fieldsToUpdate.plan = request.plan;
    }
    if (request.planId !== undefined) {
      fieldsToUpdate.planId = request.planId;
    }
    if (request.category !== undefined) {
      fieldsToUpdate.category = request.category;
    }
    if (request.website !== undefined) {
      fieldsToUpdate.website = request.website;
    }
    if (request.socialMedia !== undefined) {
      fieldsToUpdate.socialMedia = request.socialMedia;
    }

    // Actualizar la solicitud usando el método de dominio
    const updatedRequest = partnerRequest.updateFields(updatedBy, fieldsToUpdate);

    // Guardar los cambios
    const savedRequest = await this.partnerRequestRepository.update(
      updatedRequest,
    );

    return new UpdatePartnerRequestResponse(
      savedRequest.id,
      savedRequest.status,
      savedRequest.name,
      savedRequest.email,
      savedRequest.updatedBy,
      savedRequest.lastUpdated,
    );
  }
}

