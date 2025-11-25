import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { IUserRepository } from '@libs/domain';
import { GetUserProfileRequest } from './get-user-profile.request';
import { GetUserProfileResponse } from './get-user-profile.response';

/**
 * Handler para el caso de uso de obtener el perfil de un usuario
 */
@Injectable()
export class GetUserProfileHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: GetUserProfileRequest): Promise<GetUserProfileResponse> {
    const user = await this.userRepository.findById(request.userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${request.userId} not found`);
    }

    return new GetUserProfileResponse(
      user.id,
      user.email,
      user.name,
      user.roles,
      user.isActive,
      user.createdAt,
      user.updatedAt,
    );
  }
}
