import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IUserPermissionRepository,
  IPermissionRepository,
  IUserRepository,
} from '@libs/domain';
import { GetPermissionUsersRequest } from './get-permission-users.request';
import { GetPermissionUsersResponse, PermissionUserDto } from './get-permission-users.response';

/**
 * Handler para el caso de uso de obtener usuarios con un permiso específico
 */
@Injectable()
export class GetPermissionUsersHandler {
  constructor(
    @Inject('IUserPermissionRepository')
    private readonly userPermissionRepository: IUserPermissionRepository,
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: GetPermissionUsersRequest): Promise<GetPermissionUsersResponse> {
    // Validar que el permiso exista
    const permission = await this.permissionRepository.findById(request.permissionId);
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${request.permissionId} not found`);
    }

    // Obtener todas las asignaciones de este permiso
    const userPermissions = await this.userPermissionRepository.findByPermissionId(
      request.permissionId,
    );

    // Obtener detalles de cada usuario
    const userDtos: PermissionUserDto[] = [];
    for (const userPermission of userPermissions) {
      const user = await this.userRepository.findById(userPermission.userId);
      if (user) {
        userDtos.push(
          new PermissionUserDto(
            userPermission.id,
            userPermission.userId,
            user.email,
            user.name,
            userPermission.assignedBy,
            userPermission.assignedAt,
            userPermission.isActive,
          ),
        );
      }
    }

    return new GetPermissionUsersResponse(userDtos, userDtos.length);
  }
}

