import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserPermissionRepository, UserPermission } from '@libs/domain';
import { UserPermissionEntity } from '../entities/user-permission.entity';
import { UserPermissionMapper } from '../mappers/user-permission.mapper';

/**
 * Implementación del repositorio de asignaciones de permisos a usuarios usando TypeORM
 */
@Injectable()
export class UserPermissionRepository implements IUserPermissionRepository {
  constructor(
    @InjectRepository(UserPermissionEntity)
    private readonly userPermissionRepository: Repository<UserPermissionEntity>,
  ) {}

  async findById(id: number): Promise<UserPermission | null> {
    const userPermissionEntity = await this.userPermissionRepository.findOne({
      where: { id },
    });

    if (!userPermissionEntity) {
      return null;
    }

    return UserPermissionMapper.toDomain(userPermissionEntity);
  }

  async findByUserId(userId: number, includeInactive?: boolean): Promise<UserPermission[]> {
    const where: any = { userId };

    if (includeInactive === false) {
      where.isActive = true;
    }

    const userPermissionEntities = await this.userPermissionRepository.find({
      where,
      order: {
        assignedAt: 'DESC',
      },
    });

    return userPermissionEntities.map((entity) => UserPermissionMapper.toDomain(entity));
  }

  async findByPermissionId(permissionId: number): Promise<UserPermission[]> {
    const userPermissionEntities = await this.userPermissionRepository.find({
      where: { permissionId },
      order: {
        assignedAt: 'DESC',
      },
    });

    return userPermissionEntities.map((entity) => UserPermissionMapper.toDomain(entity));
  }

  async findActiveByUserId(userId: number): Promise<UserPermission[]> {
    const userPermissionEntities = await this.userPermissionRepository.find({
      where: {
        userId,
        isActive: true,
      },
      order: {
        assignedAt: 'DESC',
      },
    });

    return userPermissionEntities.map((entity) => UserPermissionMapper.toDomain(entity));
  }

  async save(userPermission: UserPermission): Promise<UserPermission> {
    const userPermissionEntity = UserPermissionMapper.toPersistence(
      userPermission,
    ) as UserPermissionEntity;
    const savedEntity = await this.userPermissionRepository.save(userPermissionEntity);
    return UserPermissionMapper.toDomain(savedEntity);
  }

  async update(userPermission: UserPermission): Promise<UserPermission> {
    const userPermissionEntity = UserPermissionMapper.toPersistence(
      userPermission,
    ) as UserPermissionEntity;
    const updatedEntity = await this.userPermissionRepository.save(userPermissionEntity);
    return UserPermissionMapper.toDomain(updatedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.userPermissionRepository.delete(id);
  }

  async exists(userId: number, permissionId: number): Promise<boolean> {
    const count = await this.userPermissionRepository.count({
      where: {
        userId,
        permissionId,
        isActive: true,
      },
    });

    return count > 0;
  }

  async findActiveByPermissionId(permissionId: number): Promise<UserPermission[]> {
    const userPermissionEntities = await this.userPermissionRepository.find({
      where: {
        permissionId,
        isActive: true,
      },
      order: {
        assignedAt: 'DESC',
      },
    });

    return userPermissionEntities.map((entity) => UserPermissionMapper.toDomain(entity));
  }
}

