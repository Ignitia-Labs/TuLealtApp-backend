import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import {
  IUserProfileRepository,
  IProfileRepository,
  IUserRepository,
  UserProfile,
} from '@libs/domain';
import { AssignProfileToUserRequest } from './assign-profile-to-user.request';
import { AssignProfileToUserResponse } from './assign-profile-to-user.response';

/**
 * Handler para el caso de uso de asignar un perfil a un usuario
 */
@Injectable()
export class AssignProfileToUserHandler {
  constructor(
    @Inject('IUserProfileRepository')
    private readonly userProfileRepository: IUserProfileRepository,
    @Inject('IProfileRepository')
    private readonly profileRepository: IProfileRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: AssignProfileToUserRequest): Promise<AssignProfileToUserResponse> {
    // Validar que el usuario exista
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${request.userId} not found`);
    }

    // Validar que el perfil exista
    const profile = await this.profileRepository.findById(request.profileId);
    if (!profile) {
      throw new NotFoundException(`Profile with ID ${request.profileId} not found`);
    }

    // Validar que el perfil esté activo
    if (!profile.isActive) {
      throw new ConflictException(`Profile with ID ${request.profileId} is not active`);
    }

    // Validar que no exista una asignación activa duplicada
    const existingAssignment = await this.userProfileRepository.findByUserIdAndProfileId(
      request.userId,
      request.profileId,
    );

    if (existingAssignment && existingAssignment.isActive) {
      throw new ConflictException(
        `User ${request.userId} already has profile ${request.profileId} assigned and active`,
      );
    }

    // Si existe una asignación inactiva, reactivarla en lugar de crear una nueva
    if (existingAssignment && !existingAssignment.isActive) {
      const reactivatedAssignment = existingAssignment.activate();
      const savedAssignment = await this.userProfileRepository.update(reactivatedAssignment);

      return new AssignProfileToUserResponse(
        savedAssignment.id,
        savedAssignment.userId,
        savedAssignment.profileId,
        savedAssignment.assignedBy,
        savedAssignment.assignedAt,
        savedAssignment.isActive,
      );
    }

    // Crear nueva asignación usando el factory method
    const userProfile = UserProfile.create(
      request.userId,
      request.profileId,
      request.assignedBy,
      true,
    );

    // Guardar la asignación
    const savedAssignment = await this.userProfileRepository.save(userProfile);

    // Retornar response DTO
    return new AssignProfileToUserResponse(
      savedAssignment.id,
      savedAssignment.userId,
      savedAssignment.profileId,
      savedAssignment.assignedBy,
      savedAssignment.assignedAt,
      savedAssignment.isActive,
    );
  }
}

