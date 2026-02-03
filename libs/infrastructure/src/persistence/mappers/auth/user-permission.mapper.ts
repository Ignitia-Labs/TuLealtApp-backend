import { UserPermission } from '@libs/domain';
import { UserPermissionEntity } from '@libs/infrastructure/entities/auth/user-permission.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia de UserPermission
 */
export class UserPermissionMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: UserPermissionEntity): UserPermission {
    return new UserPermission(
      persistenceEntity.id,
      persistenceEntity.userId,
      persistenceEntity.permissionId,
      persistenceEntity.assignedBy,
      persistenceEntity.assignedAt,
      persistenceEntity.isActive,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: UserPermission): Partial<UserPermissionEntity> {
    const entity: Partial<UserPermissionEntity> = {
      userId: domainEntity.userId,
      permissionId: domainEntity.permissionId,
      assignedBy: domainEntity.assignedBy,
      assignedAt: domainEntity.assignedAt,
      isActive: domainEntity.isActive,
    };

    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }

    return entity;
  }
}
