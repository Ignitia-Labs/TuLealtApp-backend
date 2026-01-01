import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IProfileRepository } from '@libs/domain';
import { GetProfileRequest } from './get-profile.request';
import { GetProfileResponse } from './get-profile.response';

/**
 * Handler para el caso de uso de obtener un perfil por ID
 */
@Injectable()
export class GetProfileHandler {
  constructor(
    @Inject('IProfileRepository')
    private readonly profileRepository: IProfileRepository,
  ) {}

  async execute(request: GetProfileRequest): Promise<GetProfileResponse> {
    const profile = await this.profileRepository.findById(request.profileId);

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${request.profileId} not found`);
    }

    return new GetProfileResponse(
      profile.id,
      profile.name,
      profile.description,
      profile.partnerId,
      profile.permissions,
      profile.isActive,
      profile.createdAt,
      profile.updatedAt,
    );
  }
}

