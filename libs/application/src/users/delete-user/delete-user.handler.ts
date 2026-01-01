import { Injectable, NotFoundException, ConflictException, Inject, Optional } from '@nestjs/common';
import { IUserRepository } from '@libs/domain';
import { DeleteUserRequest } from './delete-user.request';
import { DeleteUserResponse } from './delete-user.response';
import { UserChangeHistoryService } from '../user-change-history.service';

/**
 * Handler para el caso de uso de eliminar un usuario
 * Implementa soft delete: marca el usuario como inactivo en lugar de eliminarlo físicamente
 */
@Injectable()
export class DeleteUserHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Optional()
    @Inject(UserChangeHistoryService)
    private readonly historyService?: UserChangeHistoryService,
  ) {}

  async execute(request: DeleteUserRequest, changedBy?: number): Promise<DeleteUserResponse> {
    const user = await this.userRepository.findById(request.userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${request.userId} not found`);
    }

    // Verificar si el usuario ya está eliminado (soft delete)
    if (!user.isActive && user.status === 'inactive') {
      throw new ConflictException(`User with ID ${request.userId} is already deleted`);
    }

    // Soft delete: bloquear y marcar como inactivo
    const deletedUser = user.lock();

    // Actualizar en el repositorio
    await this.userRepository.update(deletedUser);

    // Registrar en historial si el servicio está disponible
    if (this.historyService && changedBy) {
      await this.historyService.recordUserDeleted(request.userId, changedBy).catch(() => {
        // No fallar si el registro de historial falla
      });
    }

    return new DeleteUserResponse(request.userId, 'User deleted successfully');
  }
}

