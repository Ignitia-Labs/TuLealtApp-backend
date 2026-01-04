import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IUserPermissionRepository,
  IPermissionRepository,
  IUserRepository,
} from '@libs/domain';
import { GetUserPermissionsRequest } from './get-user-permissions.request';
import { GetUserPermissionsResponse, UserPermissionDto } from './get-user-permissions.response';

/**
 * Handler para el caso de uso de obtener permisos directos de un usuario
 */
@Injectable()
export class GetUserPermissionsHandler {
  constructor(
    @Inject('IUserPermissionRepository')
    private readonly userPermissionRepository: IUserPermissionRepository,
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: GetUserPermissionsRequest): Promise<GetUserPermissionsResponse> {
    // Validar que el usuario exista
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${request.userId} not found`);
    }

    // Obtener todas las asignaciones de permisos directos del usuario (activas e inactivas)
    const userPermissions = await this.userPermissionRepository.findByUserId(
      request.userId,
      true, // includeInactive = true para obtener todas
    );

    // Obtener detalles de cada permiso
    const permissionDtos: UserPermissionDto[] = [];
    for (const userPermission of userPermissions) {
      const permission = await this.permissionRepository.findById(userPermission.permissionId);
      if (permission) {
        permissionDtos.push(
          new UserPermissionDto(
            userPermission.id,
            userPermission.permissionId,
            permission.code,
            permission.module,
            permission.resource,
            permission.action,
            permission.description,
            userPermission.assignedBy,
            userPermission.assignedAt,
            userPermission.isActive,
          ),
        );
      }
    }

    return new GetUserPermissionsResponse(permissionDtos, permissionDtos.length);
  }
}

