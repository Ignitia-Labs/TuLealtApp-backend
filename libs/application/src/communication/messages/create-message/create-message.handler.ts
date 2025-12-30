import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  IPartnerRepository,
  IMessageTemplateRepository,
  IMessageFilterRepository,
} from '@libs/domain';
import { CreateMessageRequest } from './create-message.request';
import { CreateMessageResponse } from './create-message.response';
import { MessageSenderService } from '../message-sender.service';
import { MessageFilter } from '@libs/domain';

/**
 * Handler para crear y enviar un mensaje
 */
@Injectable()
export class CreateMessageHandler {
  constructor(
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('IMessageTemplateRepository')
    private readonly templateRepository: IMessageTemplateRepository,
    @Inject('IMessageFilterRepository')
    private readonly filterRepository: IMessageFilterRepository,
    private readonly messageSenderService: MessageSenderService,
  ) {}

  async execute(
    request: CreateMessageRequest,
    senderId: number,
  ): Promise<CreateMessageResponse> {
    // Validar que los partnerIds existan si recipientType = 'single'
    if (request.recipientType === 'single') {
      if (!request.partnerIds || request.partnerIds.length === 0) {
        throw new BadRequestException(
          'partnerIds is required when recipientType is "single"',
        );
      }

      // Validar que todos los partners existan
      for (const partnerId of request.partnerIds) {
        const partner = await this.partnerRepository.findById(partnerId);
        if (!partner) {
          throw new BadRequestException(`Partner with ID ${partnerId} not found`);
        }
      }
    }

    // Validar filtros si recipientType = 'filtered'
    if (request.recipientType === 'filtered') {
      if (!request.filters || Object.keys(request.filters).length === 0) {
        throw new BadRequestException(
          'filters is required when recipientType is "filtered"',
        );
      }
    }

    // Validar template si se proporciona
    if (request.templateId) {
      const template = await this.templateRepository.findById(request.templateId);
      if (!template) {
        throw new BadRequestException(`Template with ID ${request.templateId} not found`);
      }

      // Validar que todas las variables requeridas estén presentes
      if (request.variables) {
        for (const variable of template.variables) {
          if (!(variable in request.variables)) {
            throw new BadRequestException(
              `Missing required variable: ${variable}`,
            );
          }
        }
      } else if (template.variables.length > 0) {
        throw new BadRequestException(
          'Variables are required when using a template',
        );
      }
    }

    // Parsear scheduledAt si existe
    const scheduledAt = request.scheduledAt
      ? new Date(request.scheduledAt)
      : null;

    if (request.scheduledAt && isNaN(scheduledAt!.getTime())) {
      throw new BadRequestException('Invalid scheduledAt format. Use ISO 8601 format.');
    }

    // Crear y enviar el mensaje
    const message = await this.messageSenderService.createAndSendMessage(
      request.subject,
      request.body,
      request.type,
      request.channel,
      request.recipientType,
      senderId,
      request.partnerIds,
      request.templateId || null,
      request.variables,
      scheduledAt,
      request.notes || null,
      request.tags || [],
      request.attachments || [],
      request.filters,
    );

    // Si el mensaje es tipo 'filtered', guardar los filtros
    if (request.recipientType === 'filtered' && request.filters) {
      const filters: MessageFilter[] = [];

      // Crear un filtro por cada criterio
      for (const [key, value] of Object.entries(request.filters)) {
        let filterType: MessageFilter['filterType'] = 'custom';

        // Determinar el tipo de filtro según la clave
        if (key === 'plan') filterType = 'plan';
        else if (key === 'countryId' || key === 'country') filterType = 'country';
        else if (key === 'status') filterType = 'status';
        else if (key === 'category') filterType = 'category';
        else if (key === 'dateRange' || key === 'date_range') filterType = 'date_range';

        const filter = MessageFilter.create(message.id, filterType, { [key]: value });
        filters.push(filter);
      }

      if (filters.length > 0) {
        await this.filterRepository.saveMany(filters);
      }
    }

    // Obtener estadísticas de entrega
    const deliveryStats = await this.messageSenderService.getDeliveryStats(
      message.id,
    );

    // Obtener nombres de partners
    const partnerNames: string[] = [];
    if (request.partnerIds) {
      for (const partnerId of request.partnerIds) {
        const partner = await this.partnerRepository.findById(partnerId);
        if (partner) {
          partnerNames.push(partner.name);
        }
      }
    }

    return new CreateMessageResponse(
      message,
      request.partnerIds || [],
      partnerNames,
      deliveryStats,
    );
  }
}

