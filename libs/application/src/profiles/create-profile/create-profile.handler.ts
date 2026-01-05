import { Injectable, Inject, ConflictException, BadRequestException } from '@nestjs/common';
import {
  IProfileRepository,
  IPermissionRepository,
  IProfilePermissionRepository,
  Profile,
  ProfilePermission,
} from '@libs/domain';
import { PermissionService } from '../../permissions/permission.service';
import { CreateProfileRequest } from './create-profile.request';
import { CreateProfileResponse } from './create-profile.response';

/**
 * Handler para el caso de uso de crear un perfil
 */
@Injectable()
export class CreateProfileHandler {
  constructor(
    @Inject('IProfileRepository')
    private readonly profileRepository: IProfileRepository,
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
    @Inject('IProfilePermissionRepository')
    private readonly profilePermissionRepository: IProfilePermissionRepository,
    private readonly permissionService: PermissionService,
  ) {}

  async execute(request: CreateProfileRequest): Promise<CreateProfileResponse> {
    // Validar formato de cada permiso
    for (const permission of request.permissions) {
      if (!this.permissionService.validatePermissionFormat(permission)) {
        throw new BadRequestException(
          `Invalid permission format: '${permission}'. Permissions must follow the format 'module.resource.action' or 'module.*'`,
        );
      }
    }

    // Validar que todos los permisos existan en el catálogo centralizado
    const validation = await this.permissionService.validatePermissionsExist(request.permissions);
    if (validation.invalid.length > 0) {
      throw new BadRequestException(
        `The following permissions do not exist in the catalog: ${validation.invalid.join(', ')}. Please create them first or use existing permissions.`,
      );
    }

    // Validar que no exista un perfil con el mismo nombre y partnerId
    const existingProfile = await this.profileRepository.findByName(
      request.name,
      request.partnerId ?? null,
    );

    if (existingProfile) {
      throw new ConflictException(
        `Profile with name '${request.name}' already exists for ${request.partnerId ? `partner ${request.partnerId}` : 'global profiles'}`,
      );
    }

    // Crear el perfil usando el factory method
    // NOTA: Después de eliminar la columna permissions, este array se usa solo
    // para la entidad de dominio. Los permisos reales se almacenan en profile_permissions.
    const profile = Profile.create(
      request.name,
      request.permissions, // Se mantiene para compatibilidad con entidad de dominio
      request.description ?? null,
      request.partnerId ?? null,
      request.isActive ?? true,
    );

    // Guardar el perfil
    const savedProfile = await this.profileRepository.save(profile);

    // Crear relaciones en profile_permissions
    const profilePermissionsToCreate: ProfilePermission[] = [];
    for (const permissionCode of request.permissions) {
      const permission = await this.permissionRepository.findByCode(permissionCode);
      if (permission) {
        const profilePermission = ProfilePermission.create(savedProfile.id, permission.id);
        profilePermissionsToCreate.push(profilePermission);
      }
    }

    if (profilePermissionsToCreate.length > 0) {
      await this.profilePermissionRepository.saveMany(profilePermissionsToCreate);
    }

    // Obtener permisos desde profile_permissions para el response
    // Después de eliminar la columna permissions, siempre se cargará desde profile_permissions
    const permissionsFromTable = await this.profileRepository.findPermissionsByProfileId(
      savedProfile.id,
    );
    // Usar permisos de tabla intermedia (después de migración, savedProfile.permissions será array vacío)
    const finalPermissions = permissionsFromTable.length > 0 ? permissionsFromTable : [];

    // Retornar response DTO
    return new CreateProfileResponse(
      savedProfile.id,
      savedProfile.name,
      savedProfile.description,
      savedProfile.partnerId,
      finalPermissions,
      savedProfile.isActive,
      savedProfile.createdAt,
      savedProfile.updatedAt,
    );
  }
}
