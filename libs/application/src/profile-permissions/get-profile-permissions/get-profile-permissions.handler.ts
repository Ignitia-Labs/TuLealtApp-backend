import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IProfilePermissionRepository,
  IProfileRepository,
  IPermissionRepository,
} from '@libs/domain';
import { GetProfilePermissionsRequest } from './get-profile-permissions.request';
import {
  GetProfilePermissionsResponse,
  ProfilePermissionDto,
} from './get-profile-permissions.response';

/**
 * Handler para el caso de uso de obtener permisos de un perfil
 */
@Injectable()
export class GetProfilePermissionsHandler {
  constructor(
    @Inject('IProfilePermissionRepository')
    private readonly profilePermissionRepository: IProfilePermissionRepository,
    @Inject('IProfileRepository')
    private readonly profileRepository: IProfileRepository,
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(
    request: GetProfilePermissionsRequest,
  ): Promise<GetProfilePermissionsResponse> {
    // Validar que el perfil exista
    const profile = await this.profileRepository.findById(request.profileId);
    if (!profile) {
      throw new NotFoundException(`Profile with ID ${request.profileId} not found`);
    }

    // Obtener todas las relaciones del perfil
    const profilePermissions = await this.profilePermissionRepository.findByProfileId(
      request.profileId,
    );

    // Obtener información completa de cada permiso
    const permissionDtos = await Promise.all(
      profilePermissions.map(async (pp) => {
        const permission = await this.permissionRepository.findById(pp.permissionId);
        if (!permission) {
          return null;
        }

        return new ProfilePermissionDto(
          pp.id,
          pp.permissionId,
          permission.code,
          permission.module,
          permission.resource,
          permission.action,
          permission.description,
          pp.createdAt,
        );
      }),
    );

    // Filtrar nulls (por si algún permiso fue eliminado)
    const validPermissions = permissionDtos.filter((p) => p !== null) as ProfilePermissionDto[];

    // Retornar response DTO
    return new GetProfilePermissionsResponse(
      profile.id,
      profile.name,
      validPermissions,
      validPermissions.length,
    );
  }
}

