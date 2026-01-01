import { Injectable, NotFoundException, Inject, Optional } from '@nestjs/common';
import { IUserRepository } from '@libs/domain';
import { LockUserRequest } from './lock-user.request';
import { LockUserResponse } from './lock-user.response';
import { UserChangeHistoryService } from '../user-change-history.service';

/**
 * Handler para el caso de uso de bloquear un usuario
 */
@Injectable()
export class LockUserHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Optional()
    @Inject(UserChangeHistoryService)
    private readonly historyService?: UserChangeHistoryService,
  ) {}

  async execute(request: LockUserRequest, changedBy?: number): Promise<LockUserResponse> {
    const user = await this.userRepository.findById(request.userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${request.userId} not found`);
    }

    // Usar método de dominio para bloquear
    const lockedUser = user.lock();

    // Actualizar en el repositorio
    const updatedUser = await this.userRepository.update(lockedUser);

    // Registrar en historial si el servicio está disponible
    if (this.historyService && changedBy) {
      await this.historyService.recordUserLocked(request.userId, changedBy).catch(() => {
        // No fallar si el registro de historial falla
      });
    }

    return new LockUserResponse(updatedUser.id, updatedUser.isActive, updatedUser.updatedAt);
  }
}
