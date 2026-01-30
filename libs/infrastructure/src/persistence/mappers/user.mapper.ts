import { User } from '@libs/domain';
import { UserEntity } from '../entities/user.entity';
import { UserRoleEntity } from '../entities/user-role.entity';
import { UserProfileDataEntity } from '../entities/user-profile-data.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 *
 * NOTA: Durante la migración, los campos JSON se mantienen como fallback.
 * Después de validar la migración, se pueden remover los campos JSON.
 */
export class UserMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   * Usa las nuevas tablas relacionadas como fuente de verdad
   */
  static toDomain(persistenceEntity: UserEntity): User {
    // Construir roles desde tabla relacionada (columnas JSON eliminadas)
    const roles: string[] = persistenceEntity.rolesRelation?.length > 0
      ? persistenceEntity.rolesRelation.map((ur) => ur.role)
      : [];

    // Construir profile desde tabla relacionada (columnas JSON eliminadas)
    const profile: Record<string, any> | null = persistenceEntity.profileDataRelation?.length > 0
      ? this.buildProfileFromRelation(persistenceEntity.profileDataRelation)
      : null;

    return new User(
      persistenceEntity.id,
      persistenceEntity.email,
      persistenceEntity.name,
      persistenceEntity.firstName,
      persistenceEntity.lastName,
      persistenceEntity.phone,
      profile,
      persistenceEntity.passwordHash,
      roles,
      persistenceEntity.isActive,
      persistenceEntity.partnerId,
      persistenceEntity.tenantId ?? null,
      persistenceEntity.branchId ?? null,
      persistenceEntity.avatar,
      persistenceEntity.status ?? 'active',
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   * Si el ID es 0, no se asigna para que la BD lo genere automáticamente
   *
   * NOTA: Esta función solo actualiza las columnas directas.
   * Las tablas relacionadas (roles, profileData) deben manejarse
   * por separado o mediante cascadas configuradas en TypeORM.
   */
  static toPersistence(domainEntity: User): Partial<UserEntity> {
    const entity: Partial<UserEntity> = {};

    // Solo asignar ID si es mayor a 0 (usuario existente)
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }

    entity.email = domainEntity.email;
    entity.name = domainEntity.name;
    entity.firstName = domainEntity.firstName;
    entity.lastName = domainEntity.lastName;
    entity.phone = domainEntity.phone;
    entity.passwordHash = domainEntity.passwordHash;
    entity.isActive = domainEntity.isActive;
    entity.partnerId = domainEntity.partnerId;
    entity.tenantId = domainEntity.tenantId;
    entity.branchId = domainEntity.branchId;
    entity.avatar = domainEntity.avatar;
    entity.status = domainEntity.status;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;

    // Construir relaciones para roles y profile (columnas JSON eliminadas)
    if (domainEntity.roles && domainEntity.roles.length > 0) {
      entity.rolesRelation = this.rolesToPersistence(domainEntity.id || 0, domainEntity.roles);
    }

    if (domainEntity.profile) {
      entity.profileDataRelation = this.profileToPersistence(domainEntity.id || 0, domainEntity.profile);
    }

    return entity;
  }

  /**
   * Construye el objeto profile desde la relación de profileData
   * Convierte clave-valor a objeto anidado si es necesario
   */
  private static buildProfileFromRelation(
    profileDataRelation: UserProfileDataEntity[],
  ): Record<string, any> {
    const profile: Record<string, any> = {};

    for (const data of profileDataRelation) {
      // Si la clave tiene puntos (ej: "preferences.language"), crear objeto anidado
      const keys = data.key.split('.');
      let current = profile;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key];
      }

      // Asignar el valor (última clave)
      const lastKey = keys[keys.length - 1];
      try {
        // Intentar parsear como JSON si es posible
        current[lastKey] = data.value ? JSON.parse(data.value) : null;
      } catch {
        // Si no es JSON válido, usar como string
        current[lastKey] = data.value;
      }
    }

    return profile;
  }

  /**
   * Convierte roles[] a UserRoleEntity[]
   * Usado para crear/actualizar la relación de roles
   */
  static rolesToPersistence(userId: number, roles: string[]): UserRoleEntity[] {
    return roles.map((role) => {
      const entity = new UserRoleEntity();
      entity.userId = userId;
      entity.role = role;
      return entity;
    });
  }

  /**
   * Convierte profile Record<string, any> a UserProfileDataEntity[]
   * Usado para crear/actualizar la relación de profileData
   */
  static profileToPersistence(
    userId: number,
    profile: Record<string, any> | null,
  ): UserProfileDataEntity[] {
    if (!profile) {
      return [];
    }

    const profileData: UserProfileDataEntity[] = [];

    // Función recursiva para aplanar objetos anidados
    const flatten = (obj: any, prefix = ''): void => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          const fullKey = prefix ? `${prefix}.${key}` : key;

          if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            // Objeto anidado, continuar recursión
            flatten(value, fullKey);
          } else {
            // Valor primitivo o array, guardar
            const entity = new UserProfileDataEntity();
            entity.userId = userId;
            entity.key = fullKey;
            entity.value = typeof value === 'string' ? value : JSON.stringify(value);
            profileData.push(entity);
          }
        }
      }
    };

    flatten(profile);
    return profileData;
  }
}
