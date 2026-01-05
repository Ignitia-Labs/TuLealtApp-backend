import {
  PartnerMessage,
  MessageType,
  MessageChannel,
  RecipientType,
  MessageStatus,
} from '../entities/partner-message.entity';

/**
 * Interfaz del repositorio de PartnerMessage
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface IPartnerMessageRepository {
  /**
   * Busca un mensaje por su ID
   */
  findById(id: number): Promise<PartnerMessage | null>;

  /**
   * Busca mensajes con filtros opcionales
   */
  findMany(options?: {
    page?: number;
    limit?: number;
    type?: MessageType;
    channel?: MessageChannel;
    status?: MessageStatus;
    recipientType?: RecipientType;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    partnerId?: number;
    senderId?: number;
  }): Promise<{ messages: PartnerMessage[]; total: number }>;

  /**
   * Busca mensajes programados que deben ser enviados
   */
  findScheduledMessages(now: Date): Promise<PartnerMessage[]>;

  /**
   * Guarda un nuevo mensaje o actualiza uno existente
   */
  save(message: PartnerMessage): Promise<PartnerMessage>;

  /**
   * Actualiza un mensaje existente
   */
  update(message: PartnerMessage): Promise<PartnerMessage>;

  /**
   * Elimina un mensaje por su ID
   */
  delete(id: number): Promise<void>;
}
