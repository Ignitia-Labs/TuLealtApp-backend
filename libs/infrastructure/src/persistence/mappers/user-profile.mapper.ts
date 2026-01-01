import { UserProfile } from '@libs/domain';
import { UserProfileEntity } from '../entities/user-profile.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia de UserProfile
 */
export class UserProfileMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: UserProfileEntity): UserProfile {
    return new UserProfile(
      persistenceEntity.id,
      persistenceEntity.userId,
      persistenceEntity.profileId,
      persistenceEntity.assignedBy,
      persistenceEntity.assignedAt,
      persistenceEntity.isActive,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: UserProfile): Partial<UserProfileEntity> {
    const entity: Partial<UserProfileEntity> = {
      userId: domainEntity.userId,
      profileId: domainEntity.profileId,
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

