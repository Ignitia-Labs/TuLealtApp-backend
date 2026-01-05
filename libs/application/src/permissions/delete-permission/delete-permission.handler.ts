import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IPermissionRepository,
  IUserPermissionRepository,
  IProfileRepository,
  IProfilePermissionRepository,
} from '@libs/domain';
import { ProfileEntity } from '@libs/infrastructure';
import { DeletePermissionRequest } from './delete-permission.request';
import { DeletePermissionResponse } from './delete-permission.response';

/**
 * Handler para el caso de uso de eliminar un permiso
 * Valida que no esté en uso antes de eliminar
 */
@Injectable()
export class DeletePermissionHandler {
  constructor(
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
    @Inject('IUserPermissionRepository')
    private readonly userPermissionRepository: IUserPermissionRepository,
    @Inject('IProfileRepository')
    private readonly profileRepository: IProfileRepository,
    @Inject('IProfilePermissionRepository')
    private readonly profilePermissionRepository: IProfilePermissionRepository,
    @InjectRepository(ProfileEntity)
    private readonly profileEntityRepository: Repository<ProfileEntity>,
  ) {}

  async execute(request: DeletePermissionRequest): Promise<DeletePermissionResponse> {
    // Buscar el permiso existente
    const permission = await this.permissionRepository.findById(request.permissionId);

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${request.permissionId} not found`);
    }

    // Validar que no esté asignado directamente a usuarios
    const userAssignments = await this.userPermissionRepository.findActiveByPermissionId(
      request.permissionId,
    );
    if (userAssignments.length > 0) {
      throw new ConflictException(
        `Permission cannot be deleted because it is assigned to ${userAssignments.length} user(s). Remove assignments first.`,
      );
    }

    // Validar que no esté en uso en perfiles activos
    // Primero verificar en profile_permissions (tabla intermedia)
    const profilePermissionsUsingPermission =
      await this.profilePermissionRepository.findByPermissionId(request.permissionId);

    if (profilePermissionsUsingPermission.length > 0) {
      // Verificar que los perfiles estén activos
      const activeProfileIds = new Set<number>();
      for (const profilePermission of profilePermissionsUsingPermission) {
        const profile = await this.profileRepository.findById(profilePermission.profileId);
        if (profile && profile.isActive) {
          activeProfileIds.add(profile.id);
        }
      }

      if (activeProfileIds.size > 0) {
        throw new ConflictException(
          `Permission cannot be deleted because it is used in ${activeProfileIds.size} active profile(s). Remove from profiles first.`,
        );
      }
    }

    // También verificar en JSON de perfiles (compatibilidad hacia atrás)
    // Después de eliminar la columna permissions, esta verificación no será necesaria
    try {
      const profilesUsingPermissionInJson = await this.profileEntityRepository
        .createQueryBuilder('profile')
        .where('profile.isActive = :isActive', { isActive: true })
        .andWhere('JSON_CONTAINS(profile.permissions, :permissionCode)', {
          permissionCode: JSON.stringify(permission.code),
        })
        .getMany();

      if (profilesUsingPermissionInJson.length > 0) {
        throw new ConflictException(
          `Permission cannot be deleted because it is used in ${profilesUsingPermissionInJson.length} active profile(s) (JSON). Remove from profiles first.`,
        );
      }
    } catch (error) {
      // Si la columna permissions no existe, ignorar el error (después de migración completa)
      // Solo lanzar error si es un error de conflicto real
      if (error instanceof ConflictException) {
        throw error;
      }
      // Si es un error de SQL (columna no existe), continuar sin verificar JSON
    }

    // Eliminar el permiso
    await this.permissionRepository.delete(request.permissionId);

    return new DeletePermissionResponse(request.permissionId, 'Permission deleted successfully');
  }
}
