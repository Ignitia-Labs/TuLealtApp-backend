import { Injectable, NotFoundException, UnauthorizedException, Inject } from '@nestjs/common';
import { IUserRepository } from '@libs/domain';
import { UpdatePasswordRequest } from './update-password.request';
import { UpdatePasswordResponse } from './update-password.response';
import * as bcrypt from 'bcrypt';

/**
 * Handler para el caso de uso de actualizar la contraseña de un usuario
 * Valida que la contraseña actual sea correcta antes de actualizar
 */
@Injectable()
export class UpdatePasswordHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: UpdatePasswordRequest): Promise<UpdatePasswordResponse> {
    // Buscar el usuario existente
    const user = await this.userRepository.findById(request.userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${request.userId} not found`);
    }

    // Validar que el usuario esté activo
    if (!user.isActiveUser()) {
      throw new UnauthorizedException('User account is locked');
    }

    // Verificar que la contraseña actual sea correcta
    const isCurrentPasswordValid = await bcrypt.compare(
      request.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Generar hash de la nueva contraseña
    const newPasswordHash = await bcrypt.hash(request.newPassword, 10);

    // Actualizar la contraseña usando el método de dominio
    const updatedUser = user.updatePassword(newPasswordHash);

    // Guardar los cambios
    const savedUser = await this.userRepository.update(updatedUser);

    // Retornar response DTO
    return new UpdatePasswordResponse(savedUser.id, savedUser.updatedAt);
  }
}

