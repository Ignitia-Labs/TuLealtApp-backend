import { Injectable, Inject } from '@nestjs/common';
import { IPermissionRepository } from '@libs/domain';
import { GetPermissionsRequest } from './get-permissions.request';
import { GetPermissionsResponse, PermissionDto } from './get-permissions.response';

/**
 * Handler para el caso de uso de obtener múltiples permisos
 */
@Injectable()
export class GetPermissionsHandler {
  constructor(
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(request: GetPermissionsRequest): Promise<GetPermissionsResponse> {
    let permissions;

    // Aplicar filtros según el request
    if (request.module && request.resource) {
      // Filtrar por módulo y recurso
      permissions = await this.permissionRepository.findByModuleAndResource(
        request.module,
        request.resource,
      );
    } else if (request.module) {
      // Filtrar solo por módulo
      permissions = await this.permissionRepository.findByModule(request.module);
    } else {
      // Sin filtros, obtener todos
      permissions = request.includeInactive
        ? await this.permissionRepository.findAll(request.skip, request.take)
        : await this.permissionRepository.findActive(request.skip, request.take);
    }

    // Filtrar inactivos si no se incluyen (solo si no usamos query directa)
    if (!request.includeInactive && (!request.module || request.resource)) {
      permissions = permissions.filter((permission) => permission.isActive);
    }

    // Obtener total para paginación
    const total = request.module
      ? await this.permissionRepository.countByModule(request.module)
      : await this.permissionRepository.count();

    // Convertir a DTOs
    const permissionDtos = permissions.map(
      (permission) =>
        new PermissionDto(
          permission.id,
          permission.code,
          permission.module,
          permission.resource,
          permission.action,
          permission.description,
          permission.isActive,
          permission.createdAt,
          permission.updatedAt,
        ),
    );

    return new GetPermissionsResponse(permissionDtos, total);
  }
}

