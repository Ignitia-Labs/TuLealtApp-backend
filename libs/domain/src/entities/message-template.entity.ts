/**
 * Entidad de dominio MessageTemplate
 * Representa una plantilla de mensaje predefinida
 * No depende de frameworks ni librerías externas
 */
export type MessageTemplateType =
  | 'urgent'
  | 'informative'
  | 'promotional'
  | 'payment_reminder'
  | 'general';

export class MessageTemplate {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly type: MessageTemplateType,
    public readonly subject: string,
    public readonly body: string,
    public readonly variables: string[],
    public readonly usageCount: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: number | null,
    public readonly isActive: boolean,
  ) {}

  /**
   * Factory method para crear una nueva plantilla
   */
  static create(
    name: string,
    type: MessageTemplateType,
    subject: string,
    body: string,
    variables: string[],
    createdBy: number | null = null,
    isActive: boolean = true,
    id?: number,
  ): MessageTemplate {
    const now = new Date();
    return new MessageTemplate(
      id || 0,
      name,
      type,
      subject,
      body,
      variables,
      0,
      now,
      now,
      createdBy,
      isActive,
    );
  }

  /**
   * Método de dominio para incrementar el contador de uso
   */
  incrementUsage(): MessageTemplate {
    return new MessageTemplate(
      this.id,
      this.name,
      this.type,
      this.subject,
      this.body,
      this.variables,
      this.usageCount + 1,
      this.createdAt,
      new Date(),
      this.createdBy,
      this.isActive,
    );
  }

  /**
   * Método de dominio para actualizar la plantilla
   */
  update(
    name?: string,
    subject?: string,
    body?: string,
    variables?: string[],
    isActive?: boolean,
  ): MessageTemplate {
    return new MessageTemplate(
      this.id,
      name ?? this.name,
      this.type,
      subject ?? this.subject,
      body ?? this.body,
      variables ?? this.variables,
      this.usageCount,
      this.createdAt,
      new Date(),
      this.createdBy,
      isActive ?? this.isActive,
    );
  }

  /**
   * Método de dominio para verificar si la plantilla está activa
   */
  isActiveTemplate(): boolean {
    return this.isActive;
  }
}

