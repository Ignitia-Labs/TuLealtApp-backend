import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPermissionRepository, Permission } from '@libs/domain';
import { PermissionEntity } from '@libs/infrastructure/entities/auth/permission.entity';
import { PermissionMapper } from '@libs/infrastructure/mappers/auth/permission.mapper';

/**
 * Implementación del repositorio de permisos usando TypeORM
 */
@Injectable()
export class PermissionRepository implements IPermissionRepository {
  constructor(
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
  ) {}

  async findById(id: number): Promise<Permission | null> {
    const permissionEntity = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permissionEntity) {
      return null;
    }

    return PermissionMapper.toDomain(permissionEntity);
  }

  async findByCode(code: string): Promise<Permission | null> {
    const permissionEntity = await this.permissionRepository.findOne({
      where: { code },
    });

    if (!permissionEntity) {
      return null;
    }

    return PermissionMapper.toDomain(permissionEntity);
  }

  async findAll(skip?: number, take?: number): Promise<Permission[]> {
    const options: any = {
      order: {
        module: 'ASC',
        resource: 'ASC',
        action: 'ASC',
      },
    };

    if (skip !== undefined) {
      options.skip = skip;
    }

    if (take !== undefined) {
      options.take = take;
    }

    const permissionEntities = await this.permissionRepository.find(options);

    return permissionEntities.map((entity) => PermissionMapper.toDomain(entity));
  }

  async findByModule(module: string): Promise<Permission[]> {
    const permissionEntities = await this.permissionRepository.find({
      where: { module },
      order: {
        resource: 'ASC',
        action: 'ASC',
      },
    });

    return permissionEntities.map((entity) => PermissionMapper.toDomain(entity));
  }

  async findByModuleAndResource(module: string, resource: string): Promise<Permission[]> {
    const permissionEntities = await this.permissionRepository.find({
      where: { module, resource },
      order: {
        action: 'ASC',
      },
    });

    return permissionEntities.map((entity) => PermissionMapper.toDomain(entity));
  }

  async save(permission: Permission): Promise<Permission> {
    const permissionEntity = PermissionMapper.toPersistence(permission) as PermissionEntity;
    const savedEntity = await this.permissionRepository.save(permissionEntity);
    return PermissionMapper.toDomain(savedEntity);
  }

  async update(permission: Permission): Promise<Permission> {
    const permissionEntity = PermissionMapper.toPersistence(permission) as PermissionEntity;
    const updatedEntity = await this.permissionRepository.save(permissionEntity);
    return PermissionMapper.toDomain(updatedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.permissionRepository.delete(id);
  }

  async validatePermissions(
    permissionCodes: string[],
  ): Promise<{ valid: string[]; invalid: string[] }> {
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const code of permissionCodes) {
      const permission = await this.findByCode(code);
      if (permission && permission.isActive) {
        valid.push(code);
      } else {
        invalid.push(code);
      }
    }

    return { valid, invalid };
  }

  async findActive(skip?: number, take?: number): Promise<Permission[]> {
    const options: any = {
      where: { isActive: true },
      order: {
        module: 'ASC',
        resource: 'ASC',
        action: 'ASC',
      },
    };

    if (skip !== undefined) {
      options.skip = skip;
    }

    if (take !== undefined) {
      options.take = take;
    }

    const permissionEntities = await this.permissionRepository.find(options);

    return permissionEntities.map((entity) => PermissionMapper.toDomain(entity));
  }

  async count(): Promise<number> {
    return this.permissionRepository.count();
  }

  async countByModule(module: string): Promise<number> {
    return this.permissionRepository.count({
      where: { module },
    });
  }
}
