import { Injectable, Inject } from '@nestjs/common';
import { INotificationRepository } from '@libs/domain';
import { MarkAllNotificationsReadRequest } from './mark-all-notifications-read.request';
import { MarkAllNotificationsReadResponse } from './mark-all-notifications-read.response';

/**
 * Handler para el caso de uso de marcar todas las notificaciones como leídas
 */
@Injectable()
export class MarkAllNotificationsReadHandler {
  constructor(
    @Inject('INotificationRepository')
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(
    request: MarkAllNotificationsReadRequest,
  ): Promise<MarkAllNotificationsReadResponse> {
    await this.notificationRepository.markAllAsRead(request.userId);
    return new MarkAllNotificationsReadResponse(request.userId);
  }
}
