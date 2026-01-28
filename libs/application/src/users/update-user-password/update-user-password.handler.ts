import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { IUserRepository } from '@libs/domain';
import { UpdateUserPasswordRequest } from './update-user-password.request';
import { UpdateUserPasswordResponse } from './update-user-password.response';
import * as bcrypt from 'bcrypt';

/**
 * Handler para el caso de uso de actualizar la contraseña de un usuario
 * Permite a un administrador actualizar la contraseña de cualquier usuario
 * sin requerir la contraseña actual
 *
 * Este handler puede ser usado para:
 * - Resetear contraseñas olvidadas
 * - Asignar nuevas contraseñas
 * - Actualizar contraseñas por seguridad
 */
@Injectable()
export class UpdateUserPasswordHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: UpdateUserPasswordRequest): Promise<UpdateUserPasswordResponse> {
    // Buscar el usuario existente
    const user = await this.userRepository.findById(request.userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${request.userId} not found`);
    }

    // Generar hash de la nueva contraseña
    const newPasswordHash = await bcrypt.hash(request.newPassword, 10);

    // Actualizar la contraseña usando el método de dominio
    const updatedUser = user.updatePassword(newPasswordHash);

    // Guardar los cambios
    const savedUser = await this.userRepository.update(updatedUser);

    // Retornar response DTO
    return new UpdateUserPasswordResponse(savedUser.id, savedUser.email, savedUser.updatedAt);
  }
}
