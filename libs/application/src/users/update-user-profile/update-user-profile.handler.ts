import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { IUserRepository } from '@libs/domain';
import { UpdateUserProfileRequest } from './update-user-profile.request';
import { UpdateUserProfileResponse } from './update-user-profile.response';

/**
 * Handler para el caso de uso de actualizar el perfil de un usuario
 */
@Injectable()
export class UpdateUserProfileHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: UpdateUserProfileRequest): Promise<UpdateUserProfileResponse> {
    // Buscar el usuario existente
    const user = await this.userRepository.findById(request.userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${request.userId} not found`);
    }

    // Validar que el email no esté en uso por otro usuario (si se está actualizando)
    if (request.email && request.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(request.email);
      if (existingUser) {
        throw new Error('Email is already in use by another user');
      }
    }

    // Actualizar el perfil usando el método de dominio
    const updatedUser = user.updateProfile(
      request.firstName,
      request.lastName,
      request.email,
      request.phone,
      request.profile,
    );

    // Guardar los cambios
    const savedUser = await this.userRepository.update(updatedUser);

    // Retornar response DTO
    return new UpdateUserProfileResponse(
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

