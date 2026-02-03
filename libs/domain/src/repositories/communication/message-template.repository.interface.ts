import { MessageTemplate, MessageTemplateType } from '@libs/domain/entities/communication/message-template.entity';

/**
 * Interfaz del repositorio de MessageTemplate
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface IMessageTemplateRepository {
  /**
   * Busca una plantilla por su ID
   */
  findById(id: number): Promise<MessageTemplate | null>;

  /**
   * Busca todas las plantillas con filtros opcionales
   */
  findAll(options?: {
    type?: MessageTemplateType;
    isActive?: boolean;
    search?: string;
  }): Promise<MessageTemplate[]>;

  /**
   * Guarda una nueva plantilla o actualiza una existente
   */
  save(template: MessageTemplate): Promise<MessageTemplate>;

  /**
   * Actualiza una plantilla existente
   */
  update(template: MessageTemplate): Promise<MessageTemplate>;

  /**
   * Elimina una plantilla por su ID
   */
  delete(id: number): Promise<void>;
}
