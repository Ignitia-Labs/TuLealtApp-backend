import { Profile } from '@libs/domain';
import { ProfileEntity } from '../entities/profile.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia de Profile
 */
export class ProfileMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   *
   * NOTA: Después de la migración a profile_permissions, el campo permissions
   * puede no existir en la tabla. En ese caso, se usa un array vacío como fallback.
   * Los permisos reales se cargan desde profile_permissions usando findPermissionsByProfileId().
   */
  static toDomain(persistenceEntity: ProfileEntity): Profile {
    // Manejar conversión de JSON para permissions (compatibilidad hacia atrás)
    // Si el campo no existe (después de migración), usar array vacío
    let permissions: string[] = [];

    if (persistenceEntity.permissions !== undefined && persistenceEntity.permissions !== null) {
      permissions = Array.isArray(persistenceEntity.permissions)
        ? persistenceEntity.permissions
        : JSON.parse(JSON.stringify(persistenceEntity.permissions || []));
    }

    return new Profile(
      persistenceEntity.id,
      persistenceEntity.name,
      persistenceEntity.description,
      persistenceEntity.partnerId,
      permissions, // Array vacío si el campo fue eliminado, se cargará desde profile_permissions
      persistenceEntity.isActive,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   *
   * NOTA: Después de la migración a profile_permissions, el campo permissions
   * NO debe incluirse en la entidad de persistencia ya que la columna fue eliminada.
   * Los permisos se gestionan exclusivamente a través de profile_permissions.
   */
  static toPersistence(domainEntity: Profile): Partial<ProfileEntity> {
    const entity: Partial<ProfileEntity> = {
      name: domainEntity.name,
      description: domainEntity.description,
      partnerId: domainEntity.partnerId,
      isActive: domainEntity.isActive,
    };

    // NO incluir permissions - la columna fue eliminada de la tabla
    // Los permisos se gestionan exclusivamente en profile_permissions
    // (entity.permissions se omite intencionalmente)

    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
      entity.createdAt = domainEntity.createdAt;
      entity.updatedAt = domainEntity.updatedAt;
    }

    return entity;
  }
}
