import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import {
  IProfilePermissionRepository,
  IProfileRepository,
  IPermissionRepository,
  ProfilePermission,
} from '@libs/domain';
import { AddPermissionToProfileRequest } from './add-permission-to-profile.request';
import { AddPermissionToProfileResponse } from './add-permission-to-profile.response';

/**
 * Handler para el caso de uso de agregar un permiso a un perfil
 */
@Injectable()
export class AddPermissionToProfileHandler {
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
    request: AddPermissionToProfileRequest,
  ): Promise<AddPermissionToProfileResponse> {
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

    // Validar que el permiso esté activo
    if (!permission.isActive) {
      throw new ConflictException(`Permission with ID ${request.permissionId} is not active`);
    }

    // Validar que no exista una relación duplicada
    const exists = await this.profilePermissionRepository.exists(profileId, request.permissionId);
    if (exists) {
      throw new ConflictException(
        `Profile ${profileId} already has permission ${request.permissionId} assigned`,
      );
    }

    // Crear nueva relación usando el factory method
    const profilePermission = ProfilePermission.create(profileId, request.permissionId);

    // Guardar la relación
    const savedRelation = await this.profilePermissionRepository.save(profilePermission);

    // Retornar response DTO
    return new AddPermissionToProfileResponse(
      savedRelation.id,
      savedRelation.profileId,
      savedRelation.permissionId,
      permission.code,
      savedRelation.createdAt,
    );
  }
}
