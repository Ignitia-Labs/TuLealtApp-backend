import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IProfileRepository, Profile } from '@libs/domain';
import { ProfileEntity } from '../entities/profile.entity';
import { ProfileMapper } from '../mappers/profile.mapper';

/**
 * Implementación del repositorio de perfiles usando TypeORM
 */
@Injectable()
export class ProfileRepository implements IProfileRepository {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
  ) {}

  async findById(id: number): Promise<Profile | null> {
    const profileEntity = await this.profileRepository.findOne({
      where: { id },
    });

    if (!profileEntity) {
      return null;
    }

    return ProfileMapper.toDomain(profileEntity);
  }

  async findByPartnerId(partnerId: number): Promise<Profile[]> {
    const profileEntities = await this.profileRepository.find({
      where: { partnerId },
      order: {
        name: 'ASC',
      },
    });

    return profileEntities.map((entity) => ProfileMapper.toDomain(entity));
  }

  async findGlobalProfiles(): Promise<Profile[]> {
    const profileEntities = await this.profileRepository.find({
      where: { partnerId: null },
      order: {
        name: 'ASC',
      },
    });

    return profileEntities.map((entity) => ProfileMapper.toDomain(entity));
  }

  async findByName(name: string, partnerId?: number | null): Promise<Profile | null> {
    const where: any = { name };
    if (partnerId !== undefined) {
      where.partnerId = partnerId;
    }

    const profileEntity = await this.profileRepository.findOne({
      where,
    });

    if (!profileEntity) {
      return null;
    }

    return ProfileMapper.toDomain(profileEntity);
  }

  async save(profile: Profile): Promise<Profile> {
    const profileEntity = ProfileMapper.toPersistence(profile) as ProfileEntity;
    const savedEntity = await this.profileRepository.save(profileEntity);
    return ProfileMapper.toDomain(savedEntity);
  }

  async update(profile: Profile): Promise<Profile> {
    const profileEntity = ProfileMapper.toPersistence(profile) as ProfileEntity;
    const updatedEntity = await this.profileRepository.save(profileEntity);
    return ProfileMapper.toDomain(updatedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.profileRepository.delete(id);
  }

  async findByUserId(userId: number): Promise<Profile[]> {
    // Obtener perfiles activos del usuario mediante join con user_profiles
    const profileEntities = await this.profileRepository
      .createQueryBuilder('profile')
      .innerJoin('user_profiles', 'userProfile', 'userProfile.profileId = profile.id')
      .where('userProfile.userId = :userId', { userId })
      .andWhere('userProfile.isActive = :isActive', { isActive: true })
      .andWhere('profile.isActive = :profileActive', { profileActive: true })
      .orderBy('profile.name', 'ASC')
      .getMany();

    return profileEntities.map((entity) => ProfileMapper.toDomain(entity));
  }
}

