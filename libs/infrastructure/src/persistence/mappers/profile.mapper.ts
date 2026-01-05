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
   * puede no existir en la tabla. En ese caso, este campo se omite del objeto.
   * Los permisos se gestionan exclusivamente a través de profile_permissions.
   */
  static toPersistence(domainEntity: Profile): Partial<ProfileEntity> {
    const entity: Partial<ProfileEntity> = {
      name: domainEntity.name,
      description: domainEntity.description,
      partnerId: domainEntity.partnerId,
      isActive: domainEntity.isActive,
    };

    // Solo incluir permissions si el campo existe en la tabla (compatibilidad hacia atrás)
    // Después de eliminar la columna, este campo se omitirá automáticamente
    // Los permisos se gestionan exclusivamente en profile_permissions
    if (domainEntity.permissions && domainEntity.permissions.length > 0) {
      // Nota: Este campo puede no existir después de la migración
      // TypeORM ignorará campos que no existen en la tabla
      (entity as any).permissions = domainEntity.permissions;
    }

    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
      entity.createdAt = domainEntity.createdAt;
      entity.updatedAt = domainEntity.updatedAt;
    }

    return entity;
  }
}
