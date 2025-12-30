import { Injectable, Inject } from '@nestjs/common';
import {
  IPartnerMessageRepository,
  IMessageRecipientRepository,
  IMessageTemplateRepository,
  IPartnerRepository,
  INotificationRepository,
  IUserRepository,
  IMessageFilterRepository,
  PartnerMessage,
  MessageRecipient,
  Notification,
} from '@libs/domain';

/**
 * Servicio para enviar mensajes a partners
 * Maneja el reemplazo de variables, creación de notificaciones y tracking
 */
@Injectable()
export class MessageSenderService {
  constructor(
    @Inject('IPartnerMessageRepository')
    private readonly messageRepository: IPartnerMessageRepository,
    @Inject('IMessageRecipientRepository')
    private readonly recipientRepository: IMessageRecipientRepository,
    @Inject('IMessageTemplateRepository')
    private readonly templateRepository: IMessageTemplateRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('INotificationRepository')
    private readonly notificationRepository: INotificationRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IMessageFilterRepository')
    private readonly filterRepository: IMessageFilterRepository,
  ) {}

  /**
   * Reemplaza variables en un texto usando el formato {{variableName}}
   */
  private replaceVariables(text: string, variables: Record<string, string>): string {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  /**
   * Obtiene los partner IDs según el tipo de destinatario
   */
  private async getPartnerIds(
    recipientType: 'single' | 'broadcast' | 'filtered',
    partnerIds?: number[],
    filters?: Record<string, any>,
  ): Promise<number[]> {
    if (recipientType === 'single' && partnerIds) {
      return partnerIds;
    }

    if (recipientType === 'broadcast') {
      const partners = await this.partnerRepository.findAll();
      return partners
        .filter((p) => p.status === 'active')
        .map((p) => p.id);
    }

    if (recipientType === 'filtered' && filters) {
      // Obtener todos los partners y aplicar filtros
      const partners = await this.partnerRepository.findAll();

      return partners
        .filter((p) => {
          // Siempre filtrar por status active
          if (p.status !== 'active') return false;

          // Filtrar por plan
          if (filters.plan && p.plan !== filters.plan) return false;

          // Filtrar por país
          if (filters.countryId && p.countryId !== filters.countryId) return false;
          if (filters.country && p.countryId !== filters.country) return false;

          // Filtrar por status (adicional al active)
          if (filters.status && p.status !== filters.status) return false;

          // Filtrar por categoría
          if (filters.category && p.category !== filters.category) return false;

          // Filtrar por rango de fechas (fecha de creación del partner)
          if (filters.dateRange || filters.date_range) {
            const dateRange = filters.dateRange || filters.date_range;
            if (dateRange.start) {
              const startDate = new Date(dateRange.start);
              if (p.createdAt < startDate) return false;
            }
            if (dateRange.end) {
              const endDate = new Date(dateRange.end);
              endDate.setHours(23, 59, 59, 999); // Incluir todo el día
              if (p.createdAt > endDate) return false;
            }
          }

          // Filtros personalizados
          if (filters.custom) {
            // Aplicar lógica de filtros personalizados según necesidad
            // Por ahora se aceptan todos si pasan los filtros anteriores
          }

          return true;
        })
        .map((p) => p.id);
    }

    return [];
  }

  /**
   * Envía un mensaje a los partners especificados
   */
  async sendMessage(
    message: PartnerMessage,
    partnerIds: number[],
    variables?: Record<string, string>,
  ): Promise<void> {
    // Si hay variables, reemplazarlas en subject y body
    let finalSubject = message.subject;
    let finalBody = message.body;

    if (variables) {
      finalSubject = this.replaceVariables(message.subject, variables);
      finalBody = this.replaceVariables(message.body, variables);
    }

    // Crear destinatarios
    const recipients: MessageRecipient[] = [];
    const now = new Date();

    for (const partnerId of partnerIds) {
      const recipient = MessageRecipient.create(message.id, partnerId, 'sent', now);
      recipients.push(recipient);
    }

    // Guardar destinatarios
    await this.recipientRepository.saveMany(recipients);

    // Si el canal es 'notification', crear notificaciones para cada partner
    if (message.channel === 'notification') {
      const partners = await Promise.all(
        partnerIds.map((id) => this.partnerRepository.findById(id)),
      );

      // Obtener todos los usuarios para buscar los asociados a los partners
      const allUsers = await this.userRepository.findAll();

      for (let i = 0; i < partners.length; i++) {
        const partner = partners[i];
        if (partner) {
          // Buscar usuarios asociados al partner
          const partnerUsers = allUsers.filter(
            (user) => user.partnerId === partner.id && user.status === 'active',
          );

          // Crear notificación para cada usuario del partner
          for (const user of partnerUsers) {
            const notification = Notification.create(
              user.id,
              'system',
              finalSubject,
              finalBody,
              {
                messageId: message.id,
                partnerId: partner.id,
                type: message.type,
              },
              false,
            );

            await this.notificationRepository.save(notification);
          }

          // Si no hay usuarios asociados, crear una notificación genérica
          // Esto puede ser útil para notificaciones que se muestren en el panel del partner
          if (partnerUsers.length === 0) {
            // Buscar usuarios admin/webmaster que puedan ver esta notificación
            const adminUsers = allUsers.filter(
              (user) =>
                (user.roles.includes('ADMIN') || user.roles.includes('WEBMASTER')) &&
                user.status === 'active',
            );

            // Crear notificación para admins (opcional, según requerimientos)
            // Por ahora no creamos notificaciones si no hay usuarios del partner
          }
        }
      }
    }

    // Actualizar el mensaje como enviado
    const sentMessage = message.markAsSent();
    await this.messageRepository.update(sentMessage);

    // Si se usó un template, incrementar su contador de uso
    if (message.templateId) {
      const template = await this.templateRepository.findById(message.templateId);
      if (template) {
        const updatedTemplate = template.incrementUsage();
        await this.templateRepository.update(updatedTemplate);
      }
    }
  }

  /**
   * Crea y envía un mensaje inmediatamente
   */
  async createAndSendMessage(
    subject: string,
    body: string,
    type: PartnerMessage['type'],
    channel: PartnerMessage['channel'],
    recipientType: PartnerMessage['recipientType'],
    senderId: number,
    partnerIds?: number[],
    templateId?: number | null,
    variables?: Record<string, string>,
    scheduledAt?: Date | null,
    notes?: string | null,
    tags?: string[],
    attachments?: PartnerMessage['attachments'],
    filters?: Record<string, any>,
  ): Promise<PartnerMessage> {
    // Obtener partner IDs según el tipo
    const finalPartnerIds = await this.getPartnerIds(recipientType, partnerIds, filters);

    // Si se usa template, obtenerlo y reemplazar variables
    if (templateId && variables) {
      const template = await this.templateRepository.findById(templateId);
      if (template) {
        subject = this.replaceVariables(template.subject, variables);
        body = this.replaceVariables(template.body, variables);
      }
    }

    // Crear el mensaje
    const message = PartnerMessage.create(
      subject,
      body,
      type,
      channel,
      recipientType,
      senderId,
      finalPartnerIds.length,
      templateId || null,
      scheduledAt || null,
      notes || null,
      tags || [],
      attachments || [],
    );

    // Guardar el mensaje
    const savedMessage = await this.messageRepository.save(message);

    // Si está programado, crear los recipients pero no enviar aún
    if (scheduledAt) {
      // Crear recipients para mensajes programados (se enviarán cuando llegue el momento)
      const recipients: MessageRecipient[] = [];
      for (const partnerId of finalPartnerIds) {
        // Crear recipient sin fecha de envío aún (se establecerá cuando se envíe)
        const recipient = MessageRecipient.create(
          savedMessage.id,
          partnerId,
          'sent', // Estado inicial, se actualizará cuando se envíe
          null, // sentAt será null hasta que se envíe
        );
        recipients.push(recipient);
      }
      await this.recipientRepository.saveMany(recipients);
    } else {
      // Si no está programado, enviar inmediatamente
      await this.sendMessage(savedMessage, finalPartnerIds, variables);
    }

    return savedMessage;
  }

  /**
   * Obtiene estadísticas de entrega para un mensaje
   */
  async getDeliveryStats(messageId: number): Promise<{
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  }> {
    return this.recipientRepository.getDeliveryStats(messageId);
  }
}

