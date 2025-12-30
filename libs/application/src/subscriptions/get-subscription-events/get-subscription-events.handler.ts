import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ISubscriptionEventRepository } from '@libs/domain';
import { GetSubscriptionEventsRequest } from './get-subscription-events.request';
import { GetSubscriptionEventsResponse, SubscriptionEventResponse } from './get-subscription-events.response';

/**
 * Handler para obtener eventos de suscripciones
 */
@Injectable()
export class GetSubscriptionEventsHandler {
  constructor(
    @Inject('ISubscriptionEventRepository')
    private readonly subscriptionEventRepository: ISubscriptionEventRepository,
  ) {}

  async execute(request: GetSubscriptionEventsRequest): Promise<GetSubscriptionEventsResponse> {
    // Validar que al menos un filtro esté presente
    if (!request.subscriptionId && !request.startDate && !request.endDate && !request.type) {
      throw new BadRequestException(
        'At least one filter (subscriptionId, startDate, endDate, or type) must be provided',
      );
    }

    // Convertir fechas YYYY-MM-DD a Date
    // startDate se convierte al inicio del día (00:00:00)
    // endDate se convierte al final del día (23:59:59.999)
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (request.startDate) {
      // Formato YYYY-MM-DD -> inicio del día
      startDate = new Date(`${request.startDate}T00:00:00.000Z`);
      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid startDate format. Use YYYY-MM-DD format.');
      }
    }

    if (request.endDate) {
      // Formato YYYY-MM-DD -> final del día
      endDate = new Date(`${request.endDate}T23:59:59.999Z`);
      if (isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid endDate format. Use YYYY-MM-DD format.');
      }
    }

    if (startDate && endDate && startDate >= endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    // Si se proporcionan fechas, usar findByDateRange
    // Si no, usar findBySubscriptionId o findByType según corresponda
    let events;
    let total: number;

    if (startDate && endDate) {
      // Usar findByDateRange con filtros opcionales
      const filters: {
        subscriptionId?: number;
        partnerId?: number;
        type?: any;
      } = {};

      if (request.subscriptionId) {
        filters.subscriptionId = request.subscriptionId;
      }

      if (request.type) {
        filters.type = request.type;
      }

      const skip = request.page && request.limit ? (request.page - 1) * request.limit : undefined;
      const take = request.limit;

      events = await this.subscriptionEventRepository.findByDateRange(
        startDate,
        endDate,
        filters,
        skip,
        take,
      );

      total = await this.subscriptionEventRepository.countByDateRange(startDate, endDate, filters);
    } else if (request.subscriptionId) {
      // Usar findBySubscriptionId
      const skip = request.page && request.limit ? (request.page - 1) * request.limit : 0;
      const take = request.limit || 100;

      events = await this.subscriptionEventRepository.findBySubscriptionId(
        request.subscriptionId,
        skip,
        take,
      );

      // Para obtener el total, necesitaríamos un método countBySubscriptionId
      // Por ahora, usamos la longitud de los eventos (no es ideal pero funciona)
      total = events.length;
    } else {
      throw new BadRequestException(
        'When not using date range, subscriptionId must be provided',
      );
    }

    // Convertir eventos a DTOs de respuesta
    const eventResponses = events.map(
      (event) =>
        new SubscriptionEventResponse(
          event.id,
          event.subscriptionId,
          event.partnerId,
          event.type,
          event.title,
          event.description,
          event.paymentId,
          event.invoiceId,
          event.metadata,
          event.occurredAt,
          event.createdAt,
        ),
    );

    return new GetSubscriptionEventsResponse(
      eventResponses,
      total,
      request.page || null,
      request.limit || null,
    );
  }
}

