import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IProfilePermissionRepository,
  IProfileRepository,
  IPermissionRepository,
} from '@libs/domain';
import { GetPermissionProfilesRequest } from './get-permission-profiles.request';
import {
  GetPermissionProfilesResponse,
  PermissionProfileDto,
} from './get-permission-profiles.response';

/**
 * Handler para el caso de uso de obtener perfiles que tienen un permiso específico
 */
@Injectable()
export class GetPermissionProfilesHandler {
  constructor(
    @Inject('IProfilePermissionRepository')
    private readonly profilePermissionRepository: IProfilePermissionRepository,
    @Inject('IProfileRepository')
    private readonly profileRepository: IProfileRepository,
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(
    request: GetPermissionProfilesRequest,
  ): Promise<GetPermissionProfilesResponse> {
    // Validar que el permiso exista
    const permission = await this.permissionRepository.findById(request.permissionId);
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${request.permissionId} not found`);
    }

    // Obtener todas las relaciones del permiso
    const profilePermissions = await this.profilePermissionRepository.findByPermissionId(
      request.permissionId,
    );

    // Obtener información completa de cada perfil
    const profileDtos = await Promise.all(
      profilePermissions.map(async (pp) => {
        const profile = await this.profileRepository.findById(pp.profileId);
        if (!profile) {
          return null;
        }

        return new PermissionProfileDto(
          pp.id,
          pp.profileId,
          profile.name,
          profile.description,
          profile.partnerId,
          profile.isActive,
          pp.createdAt,
        );
      }),
    );

    // Filtrar nulls (por si algún perfil fue eliminado)
    const validProfiles = profileDtos.filter((p) => p !== null) as PermissionProfileDto[];

    // Retornar response DTO
    return new GetPermissionProfilesResponse(
      permission.id,
      permission.code,
      validProfiles,
      validProfiles.length,
    );
  }
}

