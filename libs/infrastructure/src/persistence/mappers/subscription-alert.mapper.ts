import { SubscriptionAlert } from '@libs/domain';
import { SubscriptionAlertEntity } from '../entities/subscription-alert.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class SubscriptionAlertMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: SubscriptionAlertEntity): SubscriptionAlert {
    return new SubscriptionAlert(
      persistenceEntity.id,
      persistenceEntity.subscriptionId,
      persistenceEntity.partnerId,
      persistenceEntity.type,
      persistenceEntity.severity,
      persistenceEntity.title,
      persistenceEntity.message,
      persistenceEntity.actionRequired,
      persistenceEntity.actionLabel,
      persistenceEntity.actionUrl,
      persistenceEntity.status,
      persistenceEntity.notifyEmail,
      persistenceEntity.notifyPush,
      persistenceEntity.emailSentAt,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: SubscriptionAlert): SubscriptionAlertEntity {
    const entity = new SubscriptionAlertEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.subscriptionId = domainEntity.subscriptionId;
    entity.partnerId = domainEntity.partnerId;
    entity.type = domainEntity.type;
    entity.severity = domainEntity.severity;
    entity.title = domainEntity.title;
    entity.message = domainEntity.message;
    entity.actionRequired = domainEntity.actionRequired;
    entity.actionLabel = domainEntity.actionLabel;
    entity.actionUrl = domainEntity.actionUrl;
    entity.status = domainEntity.status;
    entity.notifyEmail = domainEntity.notifyEmail;
    entity.notifyPush = domainEntity.notifyPush;
    entity.emailSentAt = domainEntity.emailSentAt;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;
    return entity;
  }
}
