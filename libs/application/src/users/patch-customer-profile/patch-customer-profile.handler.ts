import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { IUserRepository } from '@libs/domain';
import { PatchCustomerProfileRequest } from './patch-customer-profile.request';
import { UpdateMyProfileResponse } from '../update-my-profile/update-my-profile.response';

/**
 * Handler para actualización parcial del perfil del cliente (PATCH).
 * Solo actualiza los campos presentes en el request; no sobrescribe el resto.
 */
@Injectable()
export class PatchCustomerProfileHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    userId: number,
    request: PatchCustomerProfileRequest,
  ): Promise<UpdateMyProfileResponse> {
    const hasAnyField =
      request.name !== undefined ||
      request.firstName !== undefined ||
      request.lastName !== undefined ||
      request.phone !== undefined ||
      request.isActive !== undefined;

    if (!hasAnyField) {
      throw new BadRequestException('At least one field must be provided to update');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const updatedUser = user.updateProfile(
      request.firstName,
      request.lastName,
      undefined,
      request.phone,
      undefined,
      request.name,
      undefined,
      request.isActive,
    );

    const savedUser = await this.userRepository.update(updatedUser);

    return new UpdateMyProfileResponse(
      savedUser.id,
      savedUser.email,
      savedUser.name,
      savedUser.firstName,
      savedUser.lastName,
      savedUser.phone,
      savedUser.profile,
      savedUser.roles,
      savedUser.isActive,
      savedUser.createdAt,
      savedUser.updatedAt,
    );
  }
}
