import { ProfilePermission } from '@libs/domain';
import { ProfilePermissionEntity } from '../entities/profile-permission.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia de ProfilePermission
 */
export class ProfilePermissionMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: ProfilePermissionEntity): ProfilePermission {
    return new ProfilePermission(
      persistenceEntity.id,
      persistenceEntity.profileId,
      persistenceEntity.permissionId,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: ProfilePermission): Partial<ProfilePermissionEntity> {
    const entity: Partial<ProfilePermissionEntity> = {
      profileId: domainEntity.profileId,
      permissionId: domainEntity.permissionId,
    };

    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
      entity.createdAt = domainEntity.createdAt;
      entity.updatedAt = domainEntity.updatedAt;
    }

    return entity;
  }
}
