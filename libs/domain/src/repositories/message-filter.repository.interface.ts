import { MessageFilter } from '../entities/message-filter.entity';

/**
 * Interfaz del repositorio de MessageFilter
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface IMessageFilterRepository {
  /**
   * Busca filtros por ID de mensaje
   */
  findByMessageId(messageId: number): Promise<MessageFilter[]>;

  /**
   * Guarda múltiples filtros
   */
  saveMany(filters: MessageFilter[]): Promise<MessageFilter[]>;

  /**
   * Elimina filtros de un mensaje
   */
  deleteByMessageId(messageId: number): Promise<void>;
}

