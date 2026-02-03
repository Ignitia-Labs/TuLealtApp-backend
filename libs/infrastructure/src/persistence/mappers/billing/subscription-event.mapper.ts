import { SubscriptionEvent } from '@libs/domain';
import { SubscriptionEventEntity } from '@libs/infrastructure/entities/billing/subscription-event.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class SubscriptionEventMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: SubscriptionEventEntity): SubscriptionEvent {
    return new SubscriptionEvent(
      persistenceEntity.id,
      persistenceEntity.subscriptionId,
      persistenceEntity.partnerId,
      persistenceEntity.type,
      persistenceEntity.title,
      persistenceEntity.description,
      persistenceEntity.paymentId,
      persistenceEntity.invoiceId,
      persistenceEntity.metadata,
      persistenceEntity.occurredAt,
      persistenceEntity.createdAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: SubscriptionEvent): SubscriptionEventEntity {
    const entity = new SubscriptionEventEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.subscriptionId = domainEntity.subscriptionId;
    entity.partnerId = domainEntity.partnerId;
    entity.type = domainEntity.type;
    entity.title = domainEntity.title;
    entity.description = domainEntity.description;
    entity.occurredAt = domainEntity.occurredAt;
    entity.paymentId = domainEntity.paymentId;
    entity.invoiceId = domainEntity.invoiceId;
    entity.metadata = domainEntity.metadata;
    entity.createdAt = domainEntity.createdAt;
    return entity;
  }
}
