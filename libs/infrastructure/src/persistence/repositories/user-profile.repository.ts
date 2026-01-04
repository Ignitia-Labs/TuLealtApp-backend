import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserProfileRepository, UserProfile } from '@libs/domain';
import { UserProfileEntity } from '../entities/user-profile.entity';
import { UserProfileMapper } from '../mappers/user-profile.mapper';

/**
 * Implementación del repositorio de asignaciones usuario-perfil usando TypeORM
 */
@Injectable()
export class UserProfileRepository implements IUserProfileRepository {
  constructor(
    @InjectRepository(UserProfileEntity)
    private readonly userProfileRepository: Repository<UserProfileEntity>,
  ) {}

  async findById(id: number): Promise<UserProfile | null> {
    const userProfileEntity = await this.userProfileRepository.findOne({
      where: { id },
    });

    if (!userProfileEntity) {
      return null;
    }

    return UserProfileMapper.toDomain(userProfileEntity);
  }

  async findByUserId(userId: number): Promise<UserProfile[]> {
    const userProfileEntities = await this.userProfileRepository.find({
      where: { userId },
      order: {
        assignedAt: 'DESC',
      },
    });

    return userProfileEntities.map((entity) => UserProfileMapper.toDomain(entity));
  }

  async findByProfileId(profileId: number): Promise<UserProfile[]> {
    const userProfileEntities = await this.userProfileRepository.find({
      where: { profileId },
      order: {
        assignedAt: 'DESC',
      },
    });

    return userProfileEntities.map((entity) => UserProfileMapper.toDomain(entity));
  }

  async findByUserIdAndProfileId(userId: number, profileId: number): Promise<UserProfile | null> {
    const userProfileEntity = await this.userProfileRepository.findOne({
      where: { userId, profileId },
    });

    if (!userProfileEntity) {
      return null;
    }

    return UserProfileMapper.toDomain(userProfileEntity);
  }

  async save(userProfile: UserProfile): Promise<UserProfile> {
    const userProfileEntity = UserProfileMapper.toPersistence(userProfile) as UserProfileEntity;
    console.log('[UserProfileRepository] Saving entity:', {
      userId: userProfileEntity.userId,
      profileId: userProfileEntity.profileId,
      assignedBy: userProfileEntity.assignedBy,
      isActive: userProfileEntity.isActive,
      isActiveType: typeof userProfileEntity.isActive,
      hasId: !!userProfileEntity.id,
      id: userProfileEntity.id,
    });
    const savedEntity = await this.userProfileRepository.save(userProfileEntity);
    console.log('[UserProfileRepository] Saved entity from DB:', {
      id: savedEntity.id,
      userId: savedEntity.userId,
      profileId: savedEntity.profileId,
      isActive: savedEntity.isActive,
      isActiveType: typeof savedEntity.isActive,
    });
    return UserProfileMapper.toDomain(savedEntity);
  }

  async update(userProfile: UserProfile): Promise<UserProfile> {
    const userProfileEntity = UserProfileMapper.toPersistence(userProfile) as UserProfileEntity;
    const updatedEntity = await this.userProfileRepository.save(userProfileEntity);
    return UserProfileMapper.toDomain(updatedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.userProfileRepository.delete(id);
  }

  async findActiveByUserId(userId: number): Promise<UserProfile[]> {
    const userProfileEntities = await this.userProfileRepository.find({
      where: { userId, isActive: true },
      order: {
        assignedAt: 'DESC',
      },
    });

    return userProfileEntities.map((entity) => UserProfileMapper.toDomain(entity));
  }
}
