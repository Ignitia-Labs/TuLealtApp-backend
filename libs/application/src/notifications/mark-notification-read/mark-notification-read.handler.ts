import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INotificationRepository } from '@libs/domain';
import { MarkNotificationReadRequest } from './mark-notification-read.request';
import { MarkNotificationReadResponse } from './mark-notification-read.response';

/**
 * Handler para el caso de uso de marcar notificación como leída
 */
@Injectable()
export class MarkNotificationReadHandler {
  constructor(
    @Inject('INotificationRepository')
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(request: MarkNotificationReadRequest): Promise<MarkNotificationReadResponse> {
    const notification = await this.notificationRepository.findById(request.notificationId);

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${request.notificationId} not found`);
    }

    const updatedNotification = notification.markAsRead();
    const savedNotification = await this.notificationRepository.update(updatedNotification);

    return new MarkNotificationReadResponse(savedNotification.id, savedNotification.read);
  }
}
