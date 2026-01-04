import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { IProfilePermissionRepository, ProfilePermission } from '@libs/domain';
import { ProfilePermissionEntity } from '../entities/profile-permission.entity';
import { ProfilePermissionMapper } from '../mappers/profile-permission.mapper';

/**
 * Implementación del repositorio de relaciones perfil-permiso usando TypeORM
 */
@Injectable()
export class ProfilePermissionRepository implements IProfilePermissionRepository {
  constructor(
    @InjectRepository(ProfilePermissionEntity)
    private readonly profilePermissionRepository: Repository<ProfilePermissionEntity>,
  ) {}

  async findById(id: number): Promise<ProfilePermission | null> {
    const profilePermissionEntity = await this.profilePermissionRepository.findOne({
      where: { id },
    });

    if (!profilePermissionEntity) {
      return null;
    }

    return ProfilePermissionMapper.toDomain(profilePermissionEntity);
  }

  async findByProfileId(profileId: number): Promise<ProfilePermission[]> {
    const profilePermissionEntities = await this.profilePermissionRepository.find({
      where: { profileId },
      order: {
        createdAt: 'ASC',
      },
    });

    return profilePermissionEntities.map((entity) => ProfilePermissionMapper.toDomain(entity));
  }

  async findByPermissionId(permissionId: number): Promise<ProfilePermission[]> {
    const profilePermissionEntities = await this.profilePermissionRepository.find({
      where: { permissionId },
      order: {
        createdAt: 'ASC',
      },
    });

    return profilePermissionEntities.map((entity) => ProfilePermissionMapper.toDomain(entity));
  }

  async exists(profileId: number, permissionId: number): Promise<boolean> {
    const count = await this.profilePermissionRepository.count({
      where: {
        profileId,
        permissionId,
      },
    });

    return count > 0;
  }

  async save(profilePermission: ProfilePermission): Promise<ProfilePermission> {
    const profilePermissionEntity = ProfilePermissionMapper.toPersistence(
      profilePermission,
    ) as ProfilePermissionEntity;
    const savedEntity = await this.profilePermissionRepository.save(profilePermissionEntity);
    return ProfilePermissionMapper.toDomain(savedEntity);
  }

  async saveMany(profilePermissions: ProfilePermission[]): Promise<ProfilePermission[]> {
    const entities = profilePermissions.map((pp) =>
      ProfilePermissionMapper.toPersistence(pp) as ProfilePermissionEntity,
    );
    const savedEntities = await this.profilePermissionRepository.save(entities);
    return savedEntities.map((entity) => ProfilePermissionMapper.toDomain(entity));
  }

  async delete(profileId: number, permissionId: number): Promise<void> {
    await this.profilePermissionRepository.delete({
      profileId,
      permissionId,
    });
  }

  async deleteByProfileId(profileId: number): Promise<void> {
    await this.profilePermissionRepository.delete({
      profileId,
    });
  }

  async deleteByPermissionId(permissionId: number): Promise<void> {
    await this.profilePermissionRepository.delete({
      permissionId,
    });
  }
}

