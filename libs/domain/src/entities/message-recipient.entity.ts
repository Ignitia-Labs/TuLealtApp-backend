/**
 * Entidad de dominio MessageRecipient
 * Representa la relación entre un mensaje y un partner destinatario
 * No depende de frameworks ni librerías externas
 */
export type RecipientStatus = 'sent' | 'delivered' | 'read' | 'failed';

export class MessageRecipient {
  constructor(
    public readonly id: number,
    public readonly messageId: number,
    public readonly partnerId: number,
    public readonly status: RecipientStatus,
    public readonly sentAt: Date | null,
    public readonly deliveredAt: Date | null,
    public readonly readAt: Date | null,
    public readonly failureReason: string | null,
    public readonly createdAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo destinatario
   */
  static create(
    messageId: number,
    partnerId: number,
    status: RecipientStatus = 'sent',
    sentAt: Date | null = null,
    id?: number,
  ): MessageRecipient {
    const now = new Date();
    return new MessageRecipient(
      id || 0,
      messageId,
      partnerId,
      status,
      sentAt ?? now,
      null,
      null,
      null,
      now,
    );
  }

  /**
   * Método de dominio para marcar como entregado
   */
  markAsDelivered(deliveredAt?: Date): MessageRecipient {
    return new MessageRecipient(
      this.id,
      this.messageId,
      this.partnerId,
      'delivered',
      this.sentAt,
      deliveredAt ?? new Date(),
      this.readAt,
      this.failureReason,
      this.createdAt,
    );
  }

  /**
   * Método de dominio para marcar como leído
   */
  markAsRead(readAt?: Date): MessageRecipient {
    return new MessageRecipient(
      this.id,
      this.messageId,
      this.partnerId,
      'read',
      this.sentAt,
      this.deliveredAt,
      readAt ?? new Date(),
      this.failureReason,
      this.createdAt,
    );
  }

  /**
   * Método de dominio para marcar como fallido
   */
  markAsFailed(reason: string): MessageRecipient {
    return new MessageRecipient(
      this.id,
      this.messageId,
      this.partnerId,
      'failed',
      this.sentAt,
      this.deliveredAt,
      this.readAt,
      reason,
      this.createdAt,
    );
  }

  /**
   * Método de dominio para actualizar el estado
   */
  updateStatus(
    status: RecipientStatus,
    deliveredAt?: Date | null,
    readAt?: Date | null,
    failureReason?: string | null,
  ): MessageRecipient {
    return new MessageRecipient(
      this.id,
      this.messageId,
      this.partnerId,
      status,
      this.sentAt,
      deliveredAt ?? this.deliveredAt,
      readAt ?? this.readAt,
      failureReason ?? this.failureReason,
      this.createdAt,
    );
  }
}

