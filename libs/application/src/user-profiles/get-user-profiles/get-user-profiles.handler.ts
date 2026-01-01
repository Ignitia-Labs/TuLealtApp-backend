import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IUserProfileRepository,
  IProfileRepository,
  IUserRepository,
} from '@libs/domain';
import { GetUserProfilesRequest } from './get-user-profiles.request';
import { GetUserProfilesResponse, UserProfileDto } from './get-user-profiles.response';

/**
 * Handler para el caso de uso de obtener los perfiles asignados a un usuario
 */
@Injectable()
export class GetUserProfilesHandler {
  constructor(
    @Inject('IUserProfileRepository')
    private readonly userProfileRepository: IUserProfileRepository,
    @Inject('IProfileRepository')
    private readonly profileRepository: IProfileRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: GetUserProfilesRequest): Promise<GetUserProfilesResponse> {
    // Validar que el usuario exista
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${request.userId} not found`);
    }

    // Obtener todas las asignaciones del usuario (activas e inactivas)
    const assignments = await this.userProfileRepository.findByUserId(request.userId);

    // Obtener información completa de cada perfil
    const profileDtos: UserProfileDto[] = [];
    for (const assignment of assignments) {
      const profile = await this.profileRepository.findById(assignment.profileId);
      if (profile) {
        profileDtos.push(
          new UserProfileDto(
            assignment.id,
            assignment.profileId,
            profile.name,
            profile.description,
            profile.permissions,
            assignment.assignedBy,
            assignment.assignedAt,
            assignment.isActive,
          ),
        );
      }
    }

    return new GetUserProfilesResponse(profileDtos, profileDtos.length);
  }
}

