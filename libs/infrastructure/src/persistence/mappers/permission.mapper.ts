import { Permission } from '@libs/domain';
import { PermissionEntity } from '../entities/permission.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia de Permission
 */
export class PermissionMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: PermissionEntity): Permission {
    return new Permission(
      persistenceEntity.id,
      persistenceEntity.code,
      persistenceEntity.module,
      persistenceEntity.resource,
      persistenceEntity.action,
      persistenceEntity.description,
      persistenceEntity.isActive,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: Permission): Partial<PermissionEntity> {
    const entity: Partial<PermissionEntity> = {
      code: domainEntity.code,
      module: domainEntity.module,
      resource: domainEntity.resource,
      action: domainEntity.action,
      description: domainEntity.description,
      isActive: domainEntity.isActive,
    };

    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
      entity.createdAt = domainEntity.createdAt;
      entity.updatedAt = domainEntity.updatedAt;
    }

    return entity;
  }
}

