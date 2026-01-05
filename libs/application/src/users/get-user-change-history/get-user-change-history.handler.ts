import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { IUserRepository, IUserChangeHistoryRepository } from '@libs/domain';
import { GetUserChangeHistoryRequest } from './get-user-change-history.request';
import {
  GetUserChangeHistoryResponse,
  UserChangeHistoryItem,
} from './get-user-change-history.response';

/**
 * Handler para el caso de uso de obtener el historial de cambios de un usuario
 */
@Injectable()
export class GetUserChangeHistoryHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IUserChangeHistoryRepository')
    private readonly historyRepository: IUserChangeHistoryRepository,
  ) {}

  async execute(request: GetUserChangeHistoryRequest): Promise<GetUserChangeHistoryResponse> {
    // Verificar que el usuario existe
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${request.userId} not found`);
    }

    // Obtener historial con paginación
    const skip = request.skip || 0;
    const take = request.take || 50;

    const [historyRecords, total] = await Promise.all([
      this.historyRepository.findByUserId(request.userId, skip, take),
      this.historyRepository.countByUserId(request.userId),
    ]);

    // Convertir a DTOs de response
    const historyItems = historyRecords.map(
      (record) =>
        new UserChangeHistoryItem(
          record.id,
          record.userId,
          record.changedBy,
          record.action,
          record.field,
          record.oldValue,
          record.newValue,
          record.metadata,
          record.createdAt,
        ),
    );

    return new GetUserChangeHistoryResponse(historyItems, total);
  }
}
