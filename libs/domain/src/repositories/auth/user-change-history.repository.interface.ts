import { UserChangeHistory } from '@libs/domain/entities/auth/user-change-history.entity';

/**
 * Interfaz del repositorio de historial de cambios de usuarios
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface IUserChangeHistoryRepository {
  /**
   * Guarda un nuevo registro de historial
   */
  save(history: UserChangeHistory): Promise<UserChangeHistory>;

  /**
   * Busca el historial de cambios de un usuario específico
   * @param userId ID del usuario
   * @param skip Número de registros a omitir (paginación)
   * @param take Número de registros a tomar (paginación)
   */
  findByUserId(userId: number, skip?: number, take?: number): Promise<UserChangeHistory[]>;

  /**
   * Cuenta el total de registros de historial para un usuario
   * @param userId ID del usuario
   */
  countByUserId(userId: number): Promise<number>;
}
