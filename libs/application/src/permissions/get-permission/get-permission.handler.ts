import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPermissionRepository } from '@libs/domain';
import { GetPermissionRequest } from './get-permission.request';
import { GetPermissionResponse } from './get-permission.response';

/**
 * Handler para el caso de uso de obtener un permiso por ID o código
 */
@Injectable()
export class GetPermissionHandler {
  constructor(
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(request: GetPermissionRequest): Promise<GetPermissionResponse> {
    if (!request.permissionId && !request.code) {
      throw new BadRequestException('Either permissionId or code must be provided');
    }

    let permission;

    if (request.permissionId) {
      permission = await this.permissionRepository.findById(request.permissionId);
    } else if (request.code) {
      permission = await this.permissionRepository.findByCode(request.code);
    }

    if (!permission) {
      const identifier = request.permissionId
        ? `ID ${request.permissionId}`
        : `code '${request.code}'`;
      throw new NotFoundException(`Permission with ${identifier} not found`);
    }

    return new GetPermissionResponse(
      permission.id,
      permission.code,
      permission.module,
      permission.resource,
      permission.action,
      permission.description,
      permission.isActive,
      permission.createdAt,
      permission.updatedAt,
    );
  }
}
