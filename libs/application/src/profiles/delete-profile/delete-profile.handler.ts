import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { IProfileRepository, IUserProfileRepository } from '@libs/domain';
import { DeleteProfileRequest } from './delete-profile.request';
import { DeleteProfileResponse } from './delete-profile.response';

/**
 * Handler para el caso de uso de eliminar un perfil
 */
@Injectable()
export class DeleteProfileHandler {
  constructor(
    @Inject('IProfileRepository')
    private readonly profileRepository: IProfileRepository,
    @Inject('IUserProfileRepository')
    private readonly userProfileRepository: IUserProfileRepository,
  ) {}

  async execute(request: DeleteProfileRequest): Promise<DeleteProfileResponse> {
    // Verificar que el perfil exista
    const existingProfile = await this.profileRepository.findById(request.profileId);

    if (!existingProfile) {
      throw new NotFoundException(`Profile with ID ${request.profileId} not found`);
    }

    // Validar que no tenga asignaciones activas
    const activeAssignments = await this.userProfileRepository.findByProfileId(request.profileId);
    const hasActiveAssignments = activeAssignments.some((assignment) => assignment.isActive);

    if (hasActiveAssignments) {
      throw new ConflictException(
        `Cannot delete profile with ID ${request.profileId} because it has active user assignments`,
      );
    }

    // Eliminar el perfil
    await this.profileRepository.delete(request.profileId);

    return new DeleteProfileResponse('Profile deleted successfully', request.profileId);
  }
}
