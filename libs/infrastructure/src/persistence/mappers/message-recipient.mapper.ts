import { MessageRecipient } from '@libs/domain';
import { MessageRecipientEntity } from '../entities/message-recipient.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class MessageRecipientMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: MessageRecipientEntity): MessageRecipient {
    return new MessageRecipient(
      persistenceEntity.id,
      persistenceEntity.messageId,
      persistenceEntity.partnerId,
      persistenceEntity.status,
      persistenceEntity.sentAt,
      persistenceEntity.deliveredAt,
      persistenceEntity.readAt,
      persistenceEntity.failureReason,
      persistenceEntity.createdAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: MessageRecipient): MessageRecipientEntity {
    const entity = new MessageRecipientEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.messageId = domainEntity.messageId;
    entity.partnerId = domainEntity.partnerId;
    entity.status = domainEntity.status;
    entity.sentAt = domainEntity.sentAt;
    entity.deliveredAt = domainEntity.deliveredAt;
    entity.readAt = domainEntity.readAt;
    entity.failureReason = domainEntity.failureReason;
    entity.createdAt = domainEntity.createdAt;
    return entity;
  }
}

