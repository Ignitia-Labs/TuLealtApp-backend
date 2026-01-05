import { Injectable, NotFoundException, Inject, Optional } from '@nestjs/common';
import { IUserRepository } from '@libs/domain';
import { UnlockUserRequest } from './unlock-user.request';
import { UnlockUserResponse } from './unlock-user.response';
import { UserChangeHistoryService } from '../user-change-history.service';

/**
 * Handler para el caso de uso de desbloquear un usuario
 */
@Injectable()
export class UnlockUserHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Optional()
    @Inject(UserChangeHistoryService)
    private readonly historyService?: UserChangeHistoryService,
  ) {}

  async execute(request: UnlockUserRequest, changedBy?: number): Promise<UnlockUserResponse> {
    const user = await this.userRepository.findById(request.userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${request.userId} not found`);
    }

    // Usar método de dominio para desbloquear
    const unlockedUser = user.unlock();

    // Actualizar en el repositorio
    const updatedUser = await this.userRepository.update(unlockedUser);

    // Registrar en historial si el servicio está disponible
    if (this.historyService && changedBy) {
      await this.historyService.recordUserUnlocked(request.userId, changedBy).catch(() => {
        // No fallar si el registro de historial falla
      });
    }

    return new UnlockUserResponse(updatedUser.id, updatedUser.isActive, updatedUser.updatedAt);
  }
}
