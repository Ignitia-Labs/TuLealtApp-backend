import { Injectable, Inject, ConflictException, BadRequestException } from '@nestjs/common';
import { IPermissionRepository, Permission } from '@libs/domain';
import { PermissionService } from '../permission.service';
import { CreatePermissionRequest } from './create-permission.request';
import { CreatePermissionResponse } from './create-permission.response';

/**
 * Handler para el caso de uso de crear un permiso
 */
@Injectable()
export class CreatePermissionHandler {
  constructor(
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
    private readonly permissionService: PermissionService,
  ) {}

  async execute(request: CreatePermissionRequest): Promise<CreatePermissionResponse> {
    // Validar formato del código
    const expectedCode =
      request.action === '*'
        ? `${request.module}.*`
        : `${request.module}.${request.resource}.${request.action}`;

    if (request.code !== expectedCode) {
      throw new BadRequestException(
        `Permission code "${request.code}" does not match format "${expectedCode}". Code must match module.resource.action or module.*`,
      );
    }

    // Validar formato del permiso
    if (!this.permissionService.validatePermissionFormat(request.code)) {
      throw new BadRequestException(
        `Invalid permission format: '${request.code}'. Permissions must follow the format 'module.resource.action' or 'module.*'`,
      );
    }

    // Validar que no exista un permiso con el mismo código
    const existingPermission = await this.permissionRepository.findByCode(request.code);
    if (existingPermission) {
      throw new ConflictException(`Permission with code '${request.code}' already exists`);
    }

    // Crear el permiso usando el factory method
    const permission = Permission.create(
      request.code,
      request.module,
      request.resource,
      request.action,
      request.description ?? null,
      request.isActive ?? true,
    );

    // Guardar el permiso
    const savedPermission = await this.permissionRepository.save(permission);

    // Retornar response DTO
    return new CreatePermissionResponse(
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
