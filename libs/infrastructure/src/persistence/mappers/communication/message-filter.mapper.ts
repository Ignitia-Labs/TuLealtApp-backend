import { MessageFilter } from '@libs/domain';
import { MessageFilterEntity } from '@libs/infrastructure/entities/communication/message-filter.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class MessageFilterMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: MessageFilterEntity): MessageFilter {
    return new MessageFilter(
      persistenceEntity.id,
      persistenceEntity.messageId,
      persistenceEntity.filterType,
      persistenceEntity.filterValue,
      persistenceEntity.createdAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: MessageFilter): MessageFilterEntity {
    const entity = new MessageFilterEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.messageId = domainEntity.messageId;
    entity.filterType = domainEntity.filterType;
    entity.filterValue = domainEntity.filterValue;
    entity.createdAt = domainEntity.createdAt;
    return entity;
  }
}
