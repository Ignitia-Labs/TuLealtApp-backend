import { Injectable, Inject, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { IProfileRepository, Profile } from '@libs/domain';
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

    // Retornar response DTO
    return new UpdateProfileResponse(
      savedProfile.id,
      savedProfile.name,
      savedProfile.description,
      savedProfile.partnerId,
      savedProfile.permissions,
      savedProfile.isActive,
      savedProfile.createdAt,
      savedProfile.updatedAt,
    );
  }
}

