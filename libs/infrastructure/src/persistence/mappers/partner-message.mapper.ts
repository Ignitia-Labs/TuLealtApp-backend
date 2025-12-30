import { PartnerMessage, Attachment } from '@libs/domain';
import { PartnerMessageEntity } from '../entities/partner-message.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class PartnerMessageMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: PartnerMessageEntity): PartnerMessage {
    return new PartnerMessage(
      persistenceEntity.id,
      persistenceEntity.subject,
      persistenceEntity.body,
      persistenceEntity.type,
      persistenceEntity.channel,
      persistenceEntity.recipientType,
      persistenceEntity.totalRecipients,
      persistenceEntity.senderId,
      persistenceEntity.templateId,
      persistenceEntity.scheduledAt,
      persistenceEntity.createdAt,
      persistenceEntity.sentAt,
      persistenceEntity.status,
      persistenceEntity.notes,
      persistenceEntity.tags || [],
      (persistenceEntity.attachments || []) as Attachment[],
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: PartnerMessage): PartnerMessageEntity {
    const entity = new PartnerMessageEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.subject = domainEntity.subject;
    entity.body = domainEntity.body;
    entity.type = domainEntity.type;
    entity.channel = domainEntity.channel;
    entity.recipientType = domainEntity.recipientType;
    entity.totalRecipients = domainEntity.totalRecipients;
    entity.senderId = domainEntity.senderId;
    entity.templateId = domainEntity.templateId;
    entity.scheduledAt = domainEntity.scheduledAt;
    entity.createdAt = domainEntity.createdAt;
    entity.sentAt = domainEntity.sentAt;
    entity.status = domainEntity.status;
    entity.notes = domainEntity.notes;
    entity.tags = domainEntity.tags;
    entity.attachments = domainEntity.attachments;
    return entity;
  }
}

