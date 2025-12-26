import { Notification } from '@libs/domain';
import { NotificationEntity } from '../entities/notification.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class NotificationMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: NotificationEntity): Notification {
    return new Notification(
      persistenceEntity.id,
      persistenceEntity.userId,
      persistenceEntity.type,
      persistenceEntity.title,
      persistenceEntity.message,
      persistenceEntity.data,
      persistenceEntity.read,
      persistenceEntity.createdAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: Notification): NotificationEntity {
    const entity = new NotificationEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.userId = domainEntity.userId;
    entity.type = domainEntity.type;
    entity.title = domainEntity.title;
    entity.message = domainEntity.message;
    entity.data = domainEntity.data;
    entity.read = domainEntity.read;
    entity.createdAt = domainEntity.createdAt;
    return entity;
  }
}
