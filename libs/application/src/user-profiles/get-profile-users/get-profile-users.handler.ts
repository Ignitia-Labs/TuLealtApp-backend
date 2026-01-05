import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserProfileRepository, IProfileRepository, IUserRepository } from '@libs/domain';
import { GetProfileUsersRequest } from './get-profile-users.request';
import { GetProfileUsersResponse, ProfileUserDto } from './get-profile-users.response';

/**
 * Handler para el caso de uso de obtener los usuarios que tienen un perfil específico asignado
 */
@Injectable()
export class GetProfileUsersHandler {
  constructor(
    @Inject('IUserProfileRepository')
    private readonly userProfileRepository: IUserProfileRepository,
    @Inject('IProfileRepository')
    private readonly profileRepository: IProfileRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: GetProfileUsersRequest): Promise<GetProfileUsersResponse> {
    // Validar que el perfil exista
    const profile = await this.profileRepository.findById(request.profileId);
    if (!profile) {
      throw new NotFoundException(`Profile with ID ${request.profileId} not found`);
    }

    // Obtener todas las asignaciones del perfil
    const assignments = await this.userProfileRepository.findByProfileId(request.profileId);

    // Obtener información completa de cada usuario
    const userDtos: ProfileUserDto[] = [];
    for (const assignment of assignments) {
      const user = await this.userRepository.findById(assignment.userId);
      if (user) {
        userDtos.push(
          new ProfileUserDto(
            assignment.id,
            assignment.userId,
            user.email,
            user.name,
            assignment.assignedBy,
            assignment.assignedAt,
            assignment.isActive,
          ),
        );
      }
    }

    return new GetProfileUsersResponse(userDtos, userDtos.length);
  }
}
