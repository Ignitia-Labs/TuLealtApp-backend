import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import {
  IUserPermissionRepository,
  IPermissionRepository,
  IUserRepository,
  UserPermission,
} from '@libs/domain';
import { AssignPermissionToUserRequest } from './assign-permission-to-user.request';
import { AssignPermissionToUserResponse } from './assign-permission-to-user.response';

/**
 * Handler para el caso de uso de asignar un permiso directo a un usuario
 */
@Injectable()
export class AssignPermissionToUserHandler {
  constructor(
    @Inject('IUserPermissionRepository')
    private readonly userPermissionRepository: IUserPermissionRepository,
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    request: AssignPermissionToUserRequest,
    assignedBy: number,
  ): Promise<AssignPermissionToUserResponse> {
    // Validar que el usuario exista
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${request.userId} not found`);
    }

    // Validar que el permiso exista
    const permission = await this.permissionRepository.findById(request.permissionId);
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${request.permissionId} not found`);
    }

    // Validar que el permiso esté activo
    if (!permission.isActive) {
      throw new ConflictException(`Permission with ID ${request.permissionId} is not active`);
    }

    // Validar que no exista una asignación activa duplicada
    const exists = await this.userPermissionRepository.exists(request.userId, request.permissionId);
    if (exists) {
      throw new ConflictException(
        `User ${request.userId} already has permission ${request.permissionId} assigned and active`,
      );
    }

    // Crear nueva asignación usando el factory method
    const userPermission = UserPermission.create(
      request.userId,
      request.permissionId,
      assignedBy,
      true,
    );

    // Guardar la asignación
    const savedAssignment = await this.userPermissionRepository.save(userPermission);

    // Retornar response DTO
    return new AssignPermissionToUserResponse(
      savedAssignment.id,
      savedAssignment.userId,
      savedAssignment.permissionId,
      savedAssignment.assignedBy,
      savedAssignment.assignedAt,
      savedAssignment.isActive,
    );
  }
}

