import {
  MessageRecipient,
  RecipientStatus,
} from '@libs/domain/entities/communication/message-recipient.entity';

/**
 * Interfaz del repositorio de MessageRecipient
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface IMessageRecipientRepository {
  /**
   * Busca un destinatario por su ID
   */
  findById(id: number): Promise<MessageRecipient | null>;

  /**
   * Busca destinatarios de un mensaje específico
   */
  findByMessageId(messageId: number, status?: RecipientStatus): Promise<MessageRecipient[]>;

  /**
   * Busca destinatarios de un partner específico
   */
  findByPartnerId(partnerId: number): Promise<MessageRecipient[]>;

  /**
   * Busca un destinatario específico por mensaje y partner
   */
  findByMessageAndPartner(messageId: number, partnerId: number): Promise<MessageRecipient | null>;

  /**
   * Guarda múltiples destinatarios
   */
  saveMany(recipients: MessageRecipient[]): Promise<MessageRecipient[]>;

  /**
   * Guarda un nuevo destinatario o actualiza uno existente
   */
  save(recipient: MessageRecipient): Promise<MessageRecipient>;

  /**
   * Actualiza un destinatario existente
   */
  update(recipient: MessageRecipient): Promise<MessageRecipient>;

  /**
   * Calcula estadísticas de entrega para un mensaje
   */
  getDeliveryStats(messageId: number): Promise<{
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  }>;
}
