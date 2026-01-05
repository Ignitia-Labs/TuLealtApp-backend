import { MessageTemplate } from '@libs/domain';
import { MessageTemplateEntity } from '../entities/message-template.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class MessageTemplateMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: MessageTemplateEntity): MessageTemplate {
    return new MessageTemplate(
      persistenceEntity.id,
      persistenceEntity.name,
      persistenceEntity.type,
      persistenceEntity.subject,
      persistenceEntity.body,
      persistenceEntity.variables,
      persistenceEntity.usageCount,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
      persistenceEntity.createdBy,
      persistenceEntity.isActive,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: MessageTemplate): MessageTemplateEntity {
    const entity = new MessageTemplateEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.name = domainEntity.name;
    entity.type = domainEntity.type;
    entity.subject = domainEntity.subject;
    entity.body = domainEntity.body;
    entity.variables = domainEntity.variables;
    entity.usageCount = domainEntity.usageCount;
    entity.createdBy = domainEntity.createdBy;
    entity.isActive = domainEntity.isActive;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;
    return entity;
  }
}
