import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserProfileRepository } from '@libs/domain';
import { RemoveProfileFromUserRequest } from './remove-profile-from-user.request';
import { RemoveProfileFromUserResponse } from './remove-profile-from-user.response';

/**
 * Handler para el caso de uso de remover una asignación de perfil a usuario
 * Realiza soft delete (desactiva la asignación)
 */
@Injectable()
export class RemoveProfileFromUserHandler {
  constructor(
    @Inject('IUserProfileRepository')
    private readonly userProfileRepository: IUserProfileRepository,
  ) {}

  async execute(request: RemoveProfileFromUserRequest): Promise<RemoveProfileFromUserResponse> {
    // Buscar la asignación por ID
    const existingAssignment = await this.userProfileRepository.findById(request.userProfileId);

    if (!existingAssignment) {
      throw new NotFoundException(`User profile assignment with ID ${request.userProfileId} not found`);
    }

    // Desactivar la asignación (soft delete)
    const deactivatedAssignment = existingAssignment.deactivate();
    await this.userProfileRepository.update(deactivatedAssignment);

    return new RemoveProfileFromUserResponse(
      'Profile assignment removed successfully',
      request.userProfileId,
    );
  }
}

