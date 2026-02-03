import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { INotificationRepository, Notification } from '@libs/domain';
import { NotificationEntity } from '@libs/infrastructure/entities/communication/notification.entity';
import { NotificationMapper } from '@libs/infrastructure/mappers/communication/notification.mapper';

/**
 * Implementación del repositorio de Notification usando TypeORM
 */
@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
  ) {}

  async findById(id: number): Promise<Notification | null> {
    const entity = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return NotificationMapper.toDomain(entity);
  }

  async findByUserId(userId: number, skip = 0, take = 100): Promise<Notification[]> {
    const entities = await this.notificationRepository.find({
      where: { userId },
      skip,
      take,
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => NotificationMapper.toDomain(entity));
  }

  async findUnreadByUserId(userId: number): Promise<Notification[]> {
    const entities = await this.notificationRepository.find({
      where: { userId, read: false },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => NotificationMapper.toDomain(entity));
  }

  async countUnreadByUserId(userId: number): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, read: false },
    });
  }

  async save(notification: Notification): Promise<Notification> {
    const entity = NotificationMapper.toPersistence(notification);
    const savedEntity = await this.notificationRepository.save(entity);
    return NotificationMapper.toDomain(savedEntity);
  }

  async update(notification: Notification): Promise<Notification> {
    const entity = NotificationMapper.toPersistence(notification);
    const updatedEntity = await this.notificationRepository.save(entity);
    return NotificationMapper.toDomain(updatedEntity);
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update({ userId, read: false }, { read: true });
  }

  async delete(id: number): Promise<void> {
    await this.notificationRepository.delete(id);
  }
}
