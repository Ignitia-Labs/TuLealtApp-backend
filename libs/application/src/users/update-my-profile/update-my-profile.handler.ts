import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { IUserRepository } from '@libs/domain';
import { UpdateMyProfileRequest } from './update-my-profile.request';
import { UpdateMyProfileResponse } from './update-my-profile.response';

/**
 * Handler para el caso de uso de actualizar el perfil del usuario autenticado
 */
@Injectable()
export class UpdateMyProfileHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: number, request: UpdateMyProfileRequest): Promise<UpdateMyProfileResponse> {
    // Buscar el usuario existente
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Validar que el email no esté en uso por otro usuario (si se está actualizando)
    if (request.email && request.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(request.email);
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email is already in use by another user');
      }
    }

    // Actualizar el perfil usando el método de dominio
    const updatedUser = user.updateProfile(
      request.firstName,
      request.lastName,
      request.email,
      request.phone,
      request.profile,
      request.name,
    );

    // Guardar los cambios
    const savedUser = await this.userRepository.update(updatedUser);

    // Retornar response DTO
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
