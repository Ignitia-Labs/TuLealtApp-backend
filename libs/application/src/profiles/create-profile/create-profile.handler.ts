import { Injectable, Inject, ConflictException, BadRequestException } from '@nestjs/common';
import { IProfileRepository, Profile } from '@libs/domain';
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
    const profile = Profile.create(
      request.name,
      request.permissions,
      request.description ?? null,
      request.partnerId ?? null,
      request.isActive ?? true,
    );

    // Guardar el perfil
    const savedProfile = await this.profileRepository.save(profile);

    // Retornar response DTO
    return new CreateProfileResponse(
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

