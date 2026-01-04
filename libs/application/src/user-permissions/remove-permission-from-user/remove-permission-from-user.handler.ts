import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserPermissionRepository, UserPermission } from '@libs/domain';
import { RemovePermissionFromUserRequest } from './remove-permission-from-user.request';
import { RemovePermissionFromUserResponse } from './remove-permission-from-user.response';

/**
 * Handler para el caso de uso de remover una asignación de permiso directo a usuario
 * Realiza soft delete (desactiva la asignación)
 */
@Injectable()
export class RemovePermissionFromUserHandler {
  constructor(
    @Inject('IUserPermissionRepository')
    private readonly userPermissionRepository: IUserPermissionRepository,
  ) {}

  async execute(request: RemovePermissionFromUserRequest): Promise<RemovePermissionFromUserResponse> {
    // Buscar la asignación existente
    const userPermission = await this.userPermissionRepository.findById(request.userPermissionId);

    if (!userPermission) {
      throw new NotFoundException(
        `User permission assignment with ID ${request.userPermissionId} not found`,
      );
    }

    // Si ya está inactiva, retornar sin cambios
    if (!userPermission.isActive) {
      return new RemovePermissionFromUserResponse(
        request.userPermissionId,
        'Permission assignment was already inactive',
      );
    }

    // Desactivar la asignación (soft delete)
    const deactivatedPermission = userPermission.deactivate();
    await this.userPermissionRepository.update(deactivatedPermission);

    return new RemovePermissionFromUserResponse(
      request.userPermissionId,
      'Permission assignment removed successfully',
    );
  }
}

