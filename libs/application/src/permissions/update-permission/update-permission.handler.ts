import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { IPermissionRepository, Permission } from '@libs/domain';
import { UpdatePermissionRequest } from './update-permission.request';
import { UpdatePermissionResponse } from './update-permission.response';

/**
 * Handler para el caso de uso de actualizar un permiso
 * Permite actualización parcial (PATCH) de description e isActive
 * code, module, resource y action NO se pueden cambiar
 */
@Injectable()
export class UpdatePermissionHandler {
  constructor(
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(permissionId: number, request: UpdatePermissionRequest): Promise<UpdatePermissionResponse> {
    // Buscar el permiso existente
    const existingPermission = await this.permissionRepository.findById(permissionId);

    if (!existingPermission) {
      throw new NotFoundException(`Permission with ID ${permissionId} not found`);
    }

    // Aplicar actualizaciones usando métodos de dominio
    let updatedPermission = existingPermission;

    if (request.description !== undefined) {
      updatedPermission = updatedPermission.updateDescription(request.description);
    }

    if (request.isActive !== undefined) {
      updatedPermission = request.isActive
        ? updatedPermission.activate()
        : updatedPermission.deactivate();
    }

    // Guardar el permiso actualizado
    const savedPermission = await this.permissionRepository.update(updatedPermission);

    // Retornar response DTO
    return new UpdatePermissionResponse(
      savedPermission.id,
      savedPermission.code,
      savedPermission.module,
      savedPermission.resource,
      savedPermission.action,
      savedPermission.description,
      savedPermission.isActive,
      savedPermission.createdAt,
      savedPermission.updatedAt,
    );
  }
}

