import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  IPartnerMessageRepository,
  IMessageRecipientRepository,
  IPartnerRepository,
  IUserRepository,
  INotificationRepository,
  IMessageTemplateRepository,
  IMessageFilterRepository,
  PartnerMessage,
  MessageRecipient,
} from '@libs/domain';
import { MessageSenderService } from './message-sender.service';

/**
 * Servicio para enviar mensajes programados automáticamente
 * Se ejecuta periódicamente para buscar y enviar mensajes con scheduledAt <= ahora
 */
@Injectable()
export class ScheduledMessageSenderService {
  private readonly logger = new Logger(ScheduledMessageSenderService.name);

  constructor(
    @Inject('IPartnerMessageRepository')
    private readonly messageRepository: IPartnerMessageRepository,
    @Inject('IMessageRecipientRepository')
    private readonly recipientRepository: IMessageRecipientRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('INotificationRepository')
    private readonly notificationRepository: INotificationRepository,
    @Inject('IMessageTemplateRepository')
    private readonly templateRepository: IMessageTemplateRepository,
    @Inject('IMessageFilterRepository')
    private readonly filterRepository: IMessageFilterRepository,
    private readonly messageSenderService: MessageSenderService,
  ) {}

  /**
   * Cron job que se ejecuta cada 5 minutos
   * Busca mensajes programados que deben ser enviados y los envía
   */
  @Cron('*/5 * * * *') // Cada 5 minutos
  async handleScheduledMessages() {
    this.logger.log('Iniciando verificación de mensajes programados...');

    try {
      const now = new Date();

      // Buscar mensajes programados que deben ser enviados
      const scheduledMessages = await this.messageRepository.findScheduledMessages(now);

      this.logger.log(
        `Encontrados ${scheduledMessages.length} mensajes programados para enviar`,
      );

      if (scheduledMessages.length === 0) {
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const message of scheduledMessages) {
        try {
          await this.sendScheduledMessage(message);
          successCount++;
          this.logger.log(`Mensaje programado ${message.id} enviado exitosamente`);
        } catch (error) {
          errorCount++;
          this.logger.error(
            `Error al enviar mensaje programado ${message.id}:`,
            error instanceof Error ? error.message : String(error),
          );

          // Marcar el mensaje como fallido si hay error crítico
          try {
            const failedMessage = message.updateStatus('failed');
            await this.messageRepository.update(failedMessage);
          } catch (updateError) {
            this.logger.error(
              `Error al actualizar estado del mensaje ${message.id} a failed:`,
              updateError,
            );
          }
        }
      }

      this.logger.log(
        `Procesamiento completado: ${successCount} exitosos, ${errorCount} errores`,
      );
    } catch (error) {
      this.logger.error('Error en verificación de mensajes programados:', error);
    }
  }

  /**
   * Envía un mensaje programado
   */
  private async sendScheduledMessage(message: PartnerMessage): Promise<void> {
    // Obtener destinatarios del mensaje
    const recipients = await this.recipientRepository.findByMessageId(message.id);

    let partnerIds: number[];

    if (recipients.length === 0) {
      // Si no hay destinatarios, obtenerlos según el tipo de mensaje
      partnerIds = await this.getPartnerIdsForMessage(message);

      if (partnerIds.length === 0) {
        throw new Error(`No se encontraron destinatarios para el mensaje ${message.id}`);
      }

      // Crear destinatarios antes de enviar
      const now = new Date();
      const newRecipients = partnerIds.map((partnerId) =>
        MessageRecipient.create(message.id, partnerId, 'sent', now),
      );
      await this.recipientRepository.saveMany(newRecipients);
    } else {
      // Ya hay destinatarios creados, obtener sus IDs
      partnerIds = recipients.map((r) => r.partnerId);

      // Actualizar la fecha de envío de los recipients existentes si aún no tienen sentAt
      const now = new Date();
      for (const recipient of recipients) {
        if (!recipient.sentAt) {
          // Crear nuevo recipient con sentAt actualizado usando el constructor directamente
          const recipientWithSentAt = new MessageRecipient(
            recipient.id,
            recipient.messageId,
            recipient.partnerId,
            'sent',
            now, // sentAt
            recipient.deliveredAt,
            recipient.readAt,
            recipient.failureReason,
            recipient.createdAt,
          );
          await this.recipientRepository.update(recipientWithSentAt);
        }
      }
    }

    // Enviar el mensaje usando el MessageSenderService
    // Este servicio maneja el envío real y la creación de notificaciones
    await this.messageSenderService.sendMessage(message, partnerIds);

    // Verificar que el mensaje se haya actualizado correctamente
    const updatedMessage = await this.messageRepository.findById(message.id);
    if (updatedMessage && updatedMessage.status === 'draft') {
      // Si aún está en draft, actualizarlo manualmente
      const sentMessage = message.markAsSent();
      await this.messageRepository.update(sentMessage);
    }
  }

  /**
   * Obtiene los partner IDs según el tipo de destinatario del mensaje
   */
  private async getPartnerIdsForMessage(
    message: PartnerMessage,
  ): Promise<number[]> {
    if (message.recipientType === 'broadcast') {
      const partners = await this.partnerRepository.findAll();
      return partners.filter((p) => p.status === 'active').map((p) => p.id);
    }

    if (message.recipientType === 'single') {
      // Para mensajes single, los partnerIds deberían estar en los recipients
      // Si no hay, retornamos array vacío (debería haberse creado al crear el mensaje)
      return [];
    }

    if (message.recipientType === 'filtered') {
      // Obtener los filtros guardados del mensaje
      const filters = await this.filterRepository.findByMessageId(message.id);

      if (filters.length === 0) {
        // Si no hay filtros guardados, retornar todos los activos
        const partners = await this.partnerRepository.findAll();
        return partners.filter((p) => p.status === 'active').map((p) => p.id);
      }

      // Construir objeto de filtros desde los filtros guardados
      const filtersObj: Record<string, any> = {};
      for (const filter of filters) {
        // El filterValue puede contener múltiples criterios
        Object.assign(filtersObj, filter.filterValue);
      }

      // Aplicar filtros manualmente usando la misma lógica
      const partners = await this.partnerRepository.findAll();

      return partners
        .filter((p) => {
          // Siempre filtrar por status active
          if (p.status !== 'active') return false;

          // Filtrar por plan
          if (filtersObj.plan && p.plan !== filtersObj.plan) return false;

          // Filtrar por país
          if (filtersObj.countryId && p.countryId !== filtersObj.countryId) return false;
          if (filtersObj.country && p.countryId !== filtersObj.country) return false;

          // Filtrar por categoría
          if (filtersObj.category && p.category !== filtersObj.category) return false;

          // Filtrar por rango de fechas
          if (filtersObj.dateRange || filtersObj.date_range) {
            const dateRange = filtersObj.dateRange || filtersObj.date_range;
            if (dateRange.start) {
              const startDate = new Date(dateRange.start);
              if (p.createdAt < startDate) return false;
            }
            if (dateRange.end) {
              const endDate = new Date(dateRange.end);
              endDate.setHours(23, 59, 59, 999);
              if (p.createdAt > endDate) return false;
            }
          }

          return true;
        })
        .map((p) => p.id);
    }

    return [];
  }

  /**
   * Método público para ejecutar manualmente (útil para testing o corrección)
   */
  async processScheduledMessages(): Promise<{
    processed: number;
    success: number;
    errors: number;
  }> {
    this.logger.log('Ejecutando procesamiento manual de mensajes programados...');

    const now = new Date();
    const scheduledMessages = await this.messageRepository.findScheduledMessages(now);

    let successCount = 0;
    let errorCount = 0;

    for (const message of scheduledMessages) {
      try {
        await this.sendScheduledMessage(message);
        successCount++;
      } catch (error) {
        errorCount++;
        this.logger.error(
          `Error al enviar mensaje programado ${message.id}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    return {
      processed: scheduledMessages.length,
      success: successCount,
      errors: errorCount,
    };
  }
}

