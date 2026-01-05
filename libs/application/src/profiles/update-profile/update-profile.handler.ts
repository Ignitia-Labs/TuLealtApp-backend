import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  IProfileRepository,
  IPermissionRepository,
  IProfilePermissionRepository,
  Profile,
  ProfilePermission,
} from '@libs/domain';
import { PermissionService } from '../../permissions/permission.service';
import { UpdateProfileRequest } from './update-profile.request';
import { UpdateProfileResponse } from './update-profile.response';

/**
 * Handler para el caso de uso de actualizar un perfil
 * Permite actualización parcial (PATCH) de todos los campos
 */
@Injectable()
export class UpdateProfileHandler {
  constructor(
    @Inject('IProfileRepository')
    private readonly profileRepository: IProfileRepository,
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
    @Inject('IProfilePermissionRepository')
    private readonly profilePermissionRepository: IProfilePermissionRepository,
    private readonly permissionService: PermissionService,
  ) {}

  async execute(profileId: number, request: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    // Buscar el perfil existente
    const existingProfile = await this.profileRepository.findById(profileId);

    if (!existingProfile) {
      throw new NotFoundException(`Profile with ID ${profileId} not found`);
    }

    // Validar formato de permisos si se actualizan
    if (request.permissions) {
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
    }

    // Si se está actualizando el nombre, verificar que no exista otro perfil con el mismo nombre y partnerId
    if (request.name && request.name !== existingProfile.name) {
      const duplicateProfile = await this.profileRepository.findByName(
        request.name,
        existingProfile.partnerId,
      );

      if (duplicateProfile && duplicateProfile.id !== profileId) {
        throw new ConflictException(
          `Profile with name '${request.name}' already exists for ${existingProfile.partnerId ? `partner ${existingProfile.partnerId}` : 'global profiles'}`,
        );
      }
    }

    // Aplicar actualizaciones usando métodos de dominio
    // Como Profile es inmutable, necesitamos crear una nueva instancia con los cambios
    let updatedName = existingProfile.name;
    let updatedDescription = existingProfile.description;
    let updatedPermissions = existingProfile.permissions;
    let updatedIsActive = existingProfile.isActive;

    if (request.name !== undefined) {
      updatedName = request.name;
    }

    if (request.description !== undefined) {
      updatedDescription = request.description;
    }

    if (request.permissions !== undefined) {
      updatedPermissions = request.permissions;
    }

    if (request.isActive !== undefined) {
      updatedIsActive = request.isActive;
    }

    // Crear nuevo perfil con los valores actualizados
    const updatedProfile = Profile.create(
      updatedName,
      updatedPermissions,
      updatedDescription ?? null,
      existingProfile.partnerId,
      updatedIsActive,
      existingProfile.id,
    );

    // Guardar el perfil actualizado
    const savedProfile = await this.profileRepository.update(updatedProfile);

    // Si se actualizaron los permisos, sincronizar profile_permissions
    if (request.permissions !== undefined) {
      // Obtener relaciones actuales
      const currentProfilePermissions =
        await this.profilePermissionRepository.findByProfileId(profileId);

      // Obtener códigos de permisos actuales desde relaciones
      const currentPermissionIds = new Set(currentProfilePermissions.map((pp) => pp.permissionId));

      // Obtener IDs de permisos nuevos desde códigos
      const newPermissionIds = new Set<number>();
      for (const permissionCode of request.permissions) {
        const permission = await this.permissionRepository.findByCode(permissionCode);
        if (permission) {
          newPermissionIds.add(permission.id);
        }
      }

      // Determinar qué agregar y qué eliminar
      const toAdd: number[] = [];
      const toRemove: number[] = [];

      // Permisos a agregar (están en nuevos pero no en actuales)
      for (const permissionId of newPermissionIds) {
        if (!currentPermissionIds.has(permissionId)) {
          toAdd.push(permissionId);
        }
      }

      // Permisos a remover (están en actuales pero no en nuevos)
      for (const permissionId of currentPermissionIds) {
        if (!newPermissionIds.has(permissionId)) {
          toRemove.push(permissionId);
        }
      }

      // Eliminar relaciones que ya no están
      for (const permissionId of toRemove) {
        await this.profilePermissionRepository.delete(profileId, permissionId);
      }

      // Agregar nuevas relaciones
      if (toAdd.length > 0) {
        const newProfilePermissions = toAdd.map((permissionId) =>
          ProfilePermission.create(profileId, permissionId),
        );
        await this.profilePermissionRepository.saveMany(newProfilePermissions);
      }
    }

    // Obtener permisos desde profile_permissions para el response
    // Después de eliminar la columna permissions, siempre se cargará desde profile_permissions
    const permissionsFromTable = await this.profileRepository.findPermissionsByProfileId(profileId);
    // Usar permisos de tabla intermedia (después de migración, savedProfile.permissions será array vacío)
    const finalPermissions = permissionsFromTable.length > 0 ? permissionsFromTable : [];

    // Retornar response DTO
    return new UpdateProfileResponse(
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
