import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IProfilePermissionRepository,
  IProfileRepository,
  IPermissionRepository,
} from '@libs/domain';
import { RemovePermissionFromProfileRequest } from './remove-permission-from-profile.request';
import { RemovePermissionFromProfileResponse } from './remove-permission-from-profile.response';

/**
 * Handler para el caso de uso de remover un permiso de un perfil
 */
@Injectable()
export class RemovePermissionFromProfileHandler {
  constructor(
    @Inject('IProfilePermissionRepository')
    private readonly profilePermissionRepository: IProfilePermissionRepository,
    @Inject('IProfileRepository')
    private readonly profileRepository: IProfileRepository,
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(
    profileId: number,
    request: RemovePermissionFromProfileRequest,
  ): Promise<RemovePermissionFromProfileResponse> {
    // Validar que el perfil exista
    const profile = await this.profileRepository.findById(profileId);
    if (!profile) {
      throw new NotFoundException(`Profile with ID ${profileId} not found`);
    }

    // Validar que el permiso exista
    const permission = await this.permissionRepository.findById(request.permissionId);
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${request.permissionId} not found`);
    }

    // Validar que la relación exista
    const exists = await this.profilePermissionRepository.exists(profileId, request.permissionId);
    if (!exists) {
      throw new NotFoundException(
        `Profile ${profileId} does not have permission ${request.permissionId} assigned`,
      );
    }

    // Eliminar la relación
    await this.profilePermissionRepository.delete(profileId, request.permissionId);

    // Retornar response DTO
    return new RemovePermissionFromProfileResponse(
      profileId,
      request.permissionId,
      'Permission removed from profile successfully',
    );
  }
}

