import { Injectable, Inject } from '@nestjs/common';
import { IUserChangeHistoryRepository, UserChangeHistory } from '@libs/domain';

/**
 * Servicio para registrar cambios en el historial de usuarios
 * Centraliza la lógica de registro de cambios para evitar duplicación de código
 */
@Injectable()
export class UserChangeHistoryService {
  constructor(
    @Inject('IUserChangeHistoryRepository')
    private readonly historyRepository: IUserChangeHistoryRepository,
  ) {}

  /**
   * Registra un cambio en el historial de un usuario
   */
  async recordChange(
    userId: number,
    changedBy: number,
    action: UserChangeHistory['action'],
    field: string | null = null,
    oldValue: string | null = null,
    newValue: string | null = null,
    metadata: Record<string, any> | null = null,
  ): Promise<void> {
    const history = UserChangeHistory.create(
      userId,
      changedBy,
      action,
      field,
      oldValue,
      newValue,
      metadata,
    );

    await this.historyRepository.save(history);
  }

  /**
   * Registra la creación de un usuario
   */
  async recordUserCreated(
    userId: number,
    changedBy: number,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.recordChange(userId, changedBy, 'created', null, null, null, metadata);
  }

  /**
   * Registra el bloqueo de un usuario
   */
  async recordUserLocked(userId: number, changedBy: number): Promise<void> {
    await this.recordChange(userId, changedBy, 'locked', 'isActive', 'true', 'false');
  }

  /**
   * Registra el desbloqueo de un usuario
   */
  async recordUserUnlocked(userId: number, changedBy: number): Promise<void> {
    await this.recordChange(userId, changedBy, 'unlocked', 'isActive', 'false', 'true');
  }

  /**
   * Registra la eliminación de un usuario
   */
  async recordUserDeleted(userId: number, changedBy: number): Promise<void> {
    await this.recordChange(userId, changedBy, 'deleted', 'isActive', 'true', 'false');
  }

  /**
   * Registra la actualización de un campo específico
   */
  async recordFieldUpdate(
    userId: number,
    changedBy: number,
    field: string,
    oldValue: string,
    newValue: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.recordChange(userId, changedBy, 'updated', field, oldValue, newValue, metadata);
  }
}
