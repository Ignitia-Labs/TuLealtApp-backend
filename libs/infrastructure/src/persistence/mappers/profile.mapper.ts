import { Profile } from '@libs/domain';
import { ProfileEntity } from '../entities/profile.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia de Profile
 */
export class ProfileMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: ProfileEntity): Profile {
    // Manejar conversión de JSON para permissions
    const permissions = Array.isArray(persistenceEntity.permissions)
      ? persistenceEntity.permissions
      : JSON.parse(JSON.stringify(persistenceEntity.permissions || []));

    return new Profile(
      persistenceEntity.id,
      persistenceEntity.name,
      persistenceEntity.description,
      persistenceEntity.partnerId,
      permissions,
      persistenceEntity.isActive,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: Profile): Partial<ProfileEntity> {
    const entity: Partial<ProfileEntity> = {
      name: domainEntity.name,
      description: domainEntity.description,
      partnerId: domainEntity.partnerId,
      permissions: domainEntity.permissions, // JSON se maneja automáticamente por TypeORM
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

