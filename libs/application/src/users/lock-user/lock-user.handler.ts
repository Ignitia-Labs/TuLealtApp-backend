import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { IUserRepository } from '@libs/domain';
import { LockUserRequest } from './lock-user.request';
import { LockUserResponse } from './lock-user.response';

/**
 * Handler para el caso de uso de bloquear un usuario
 */
@Injectable()
export class LockUserHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: LockUserRequest): Promise<LockUserResponse> {
    const user = await this.userRepository.findById(request.userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${request.userId} not found`);
    }

    // Usar método de dominio para bloquear
    const lockedUser = user.lock();

    // Actualizar en el repositorio
    const updatedUser = await this.userRepository.update(lockedUser);

    return new LockUserResponse(updatedUser.id, updatedUser.isActive, updatedUser.updatedAt);
  }
}
