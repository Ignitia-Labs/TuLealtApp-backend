import { UserChangeHistory } from '@libs/domain';
import { UserChangeHistoryEntity } from '../entities/user-change-history.entity';

/**
 * Mapper para convertir entre entidades de dominio y persistencia de UserChangeHistory
 */
export class UserChangeHistoryMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(entity: UserChangeHistoryEntity): UserChangeHistory {
    return new UserChangeHistory(
      entity.id,
      entity.userId,
      entity.changedBy,
      entity.action as any,
      entity.field,
      entity.oldValue,
      entity.newValue,
      entity.metadata,
      entity.createdAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domain: UserChangeHistory): UserChangeHistoryEntity {
    const entity = new UserChangeHistoryEntity();
    entity.id = domain.id;
    entity.userId = domain.userId;
    entity.changedBy = domain.changedBy;
    entity.action = domain.action;
    entity.field = domain.field;
    entity.oldValue = domain.oldValue;
    entity.newValue = domain.newValue;
    entity.metadata = domain.metadata;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}
