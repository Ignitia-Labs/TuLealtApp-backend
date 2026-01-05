import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerSubscriptionEntity, PartnerMapper } from '@libs/infrastructure';
import { DeleteSubscriptionRequest } from './delete-subscription.request';
import { DeleteSubscriptionResponse } from './delete-subscription.response';
import { SubscriptionEventHelper } from '../subscription-event.helper';

/**
 * Handler para el caso de uso de eliminar una suscripción
 */
@Injectable()
export class DeleteSubscriptionHandler {
  constructor(
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    private readonly subscriptionEventHelper: SubscriptionEventHelper,
  ) {}

  async execute(request: DeleteSubscriptionRequest): Promise<DeleteSubscriptionResponse> {
    const subscriptionEntity = await this.subscriptionRepository.findOne({
      where: { id: request.subscriptionId },
    });

    if (!subscriptionEntity) {
      throw new NotFoundException(`Subscription with ID ${request.subscriptionId} not found`);
    }

    // Convertir a dominio para registrar evento antes de eliminar
    const subscription = PartnerMapper.subscriptionToDomain(subscriptionEntity);

    // Registrar evento de cancelación antes de eliminar
    await this.subscriptionEventHelper.createEvent(subscription, 'cancelled', {
      deleted: true,
    });

    await this.subscriptionRepository.remove(subscriptionEntity);

    return new DeleteSubscriptionResponse(
      request.subscriptionId,
      'Subscription deleted successfully',
    );
  }
}
