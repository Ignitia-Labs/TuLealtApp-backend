import { Injectable, Inject } from '@nestjs/common';
import { INotificationRepository } from '@libs/domain';
import { GetNotificationsRequest } from './get-notifications.request';
import { GetNotificationsResponse, NotificationDto } from './get-notifications.response';

/**
 * Handler para el caso de uso de obtener notificaciones
 */
@Injectable()
export class GetNotificationsHandler {
  constructor(
    @Inject('INotificationRepository')
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(request: GetNotificationsRequest): Promise<GetNotificationsResponse> {
    let notifications;

    if (request.unreadOnly) {
      notifications = await this.notificationRepository.findUnreadByUserId(request.userId);
    } else {
      notifications = await this.notificationRepository.findByUserId(
        request.userId,
        request.skip || 0,
        request.take || 20,
      );
    }

    const unreadCount = await this.notificationRepository.countUnreadByUserId(request.userId);

    const notificationDtos: NotificationDto[] = notifications.map(
      (notification) =>
        new NotificationDto(
          notification.id,
          notification.userId,
          notification.type,
          notification.title,
          notification.message,
          notification.data,
          notification.read,
          notification.createdAt,
        ),
    );

    return new GetNotificationsResponse(notificationDtos, unreadCount);
  }
}

