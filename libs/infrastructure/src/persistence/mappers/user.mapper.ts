import { User } from '@libs/domain';
import { UserEntity } from '../entities/user.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class UserMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: UserEntity): User {
    return new User(
      persistenceEntity.id,
      persistenceEntity.email,
      persistenceEntity.name,
      persistenceEntity.firstName,
      persistenceEntity.lastName,
      persistenceEntity.phone,
      persistenceEntity.profile,
      persistenceEntity.passwordHash,
      persistenceEntity.roles,
      persistenceEntity.isActive,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   * Si el ID es 0, no se asigna para que la BD lo genere automáticamente
   */
  static toPersistence(domainEntity: User): UserEntity {
    const entity = new UserEntity();
    // Solo asignar ID si es mayor a 0 (usuario existente)
    // Si es 0, la BD generará el ID automáticamente
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.email = domainEntity.email;
    entity.name = domainEntity.name;
    entity.firstName = domainEntity.firstName;
    entity.lastName = domainEntity.lastName;
    entity.phone = domainEntity.phone;
    entity.profile = domainEntity.profile;
    entity.passwordHash = domainEntity.passwordHash;
    entity.roles = domainEntity.roles;
    entity.isActive = domainEntity.isActive;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;
    return entity;
  }
}
