/**
 * Entidad de dominio PartnerMessage
 * Representa un mensaje enviado a partners
 * No depende de frameworks ni librerías externas
 */
export type MessageType = 'urgent' | 'informative' | 'promotional' | 'payment_reminder' | 'general';

export type MessageChannel = 'notification' | 'email' | 'whatsapp' | 'sms';

export type RecipientType = 'single' | 'broadcast' | 'filtered';

export type MessageStatus = 'draft' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export class PartnerMessage {
  constructor(
    public readonly id: number,
    public readonly subject: string,
    public readonly body: string,
    public readonly type: MessageType,
    public readonly channel: MessageChannel,
    public readonly recipientType: RecipientType,
    public readonly totalRecipients: number,
    public readonly senderId: number,
    public readonly templateId: number | null,
    public readonly scheduledAt: Date | null,
    public readonly createdAt: Date,
    public readonly sentAt: Date | null,
    public readonly status: MessageStatus,
    public readonly notes: string | null,
    public readonly tags: string[],
    public readonly attachments: Attachment[],
  ) {}

  /**
   * Factory method para crear un nuevo mensaje
   */
  static create(
    subject: string,
    body: string,
    type: MessageType,
    channel: MessageChannel,
    recipientType: RecipientType,
    senderId: number,
    totalRecipients: number = 0,
    templateId: number | null = null,
    scheduledAt: Date | null = null,
    notes: string | null = null,
    tags: string[] = [],
    attachments: Attachment[] = [],
    id?: number,
  ): PartnerMessage {
    const now = new Date();
    const status: MessageStatus = scheduledAt ? 'draft' : 'draft';
    return new PartnerMessage(
      id || 0,
      subject,
      body,
      type,
      channel,
      recipientType,
      totalRecipients,
      senderId,
      templateId,
      scheduledAt,
      now,
      null,
      status,
      notes,
      tags,
      attachments,
    );
  }

  /**
   * Método de dominio para marcar el mensaje como enviado
   */
  markAsSent(): PartnerMessage {
    return new PartnerMessage(
      this.id,
      this.subject,
      this.body,
      this.type,
      this.channel,
      this.recipientType,
      this.totalRecipients,
      this.senderId,
      this.templateId,
      this.scheduledAt,
      this.createdAt,
      new Date(),
      'sent',
      this.notes,
      this.tags,
      this.attachments,
    );
  }

  /**
   * Método de dominio para actualizar el estado del mensaje
   */
  updateStatus(status: MessageStatus): PartnerMessage {
    return new PartnerMessage(
      this.id,
      this.subject,
      this.body,
      this.type,
      this.channel,
      this.recipientType,
      this.totalRecipients,
      this.senderId,
      this.templateId,
      this.scheduledAt,
      this.createdAt,
      this.sentAt,
      status,
      this.notes,
      this.tags,
      this.attachments,
    );
  }

  /**
   * Método de dominio para actualizar el mensaje (solo si está en draft)
   */
  update(
    subject?: string,
    body?: string,
    notes?: string | null,
    tags?: string[],
    attachments?: Attachment[],
  ): PartnerMessage {
    if (this.status !== 'draft') {
      throw new Error('Cannot update message that is not in draft status');
    }
    return new PartnerMessage(
      this.id,
      subject ?? this.subject,
      body ?? this.body,
      this.type,
      this.channel,
      this.recipientType,
      this.totalRecipients,
      this.senderId,
      this.templateId,
      this.scheduledAt,
      this.createdAt,
      this.sentAt,
      this.status,
      notes !== undefined ? notes : this.notes,
      tags ?? this.tags,
      attachments ?? this.attachments,
    );
  }

  /**
   * Método de dominio para verificar si el mensaje puede ser editado
   */
  canBeEdited(): boolean {
    return this.status === 'draft';
  }

  /**
   * Método de dominio para verificar si el mensaje puede ser eliminado
   */
  canBeDeleted(): boolean {
    return this.status === 'draft';
  }
}
