import { Injectable, Inject } from '@nestjs/common';
import { SubscriptionAlert, ISubscriptionAlertRepository } from '@libs/domain';
import { CreateSubscriptionAlertRequest } from './create-subscription-alert.request';
import { CreateSubscriptionAlertResponse } from './create-subscription-alert.response';

/**
 * Handler para el caso de uso de crear una alerta de suscripción
 */
@Injectable()
export class CreateSubscriptionAlertHandler {
  constructor(
    @Inject('ISubscriptionAlertRepository')
    private readonly alertRepository: ISubscriptionAlertRepository,
  ) {}

  async execute(
    request: CreateSubscriptionAlertRequest,
  ): Promise<CreateSubscriptionAlertResponse> {
    const alert = SubscriptionAlert.create(
      request.subscriptionId,
      request.partnerId,
      request.type,
      request.severity,
      request.title,
      request.message,
      request.actionRequired ?? false,
      request.actionLabel ?? null,
      request.actionUrl ?? null,
      request.status ?? 'active',
      request.notifyEmail ?? true,
      request.notifyPush ?? true,
    );

    const savedAlert = await this.alertRepository.save(alert);

    return new CreateSubscriptionAlertResponse(
      savedAlert.id,
      savedAlert.subscriptionId,
      savedAlert.type,
      savedAlert.severity,
      savedAlert.title,
      savedAlert.status,
      savedAlert.createdAt,
    );
  }
}

