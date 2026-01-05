import { Injectable, Inject } from '@nestjs/common';
import { IPartnerMessageRepository, IMessageRecipientRepository } from '@libs/domain';
import { GetStatsRequest } from './get-stats.request';
import { GetStatsResponse } from './get-stats.response';

/**
 * Handler para obtener estadísticas de comunicaciones
 */
@Injectable()
export class GetStatsHandler {
  constructor(
    @Inject('IPartnerMessageRepository')
    private readonly messageRepository: IPartnerMessageRepository,
    @Inject('IMessageRecipientRepository')
    private readonly recipientRepository: IMessageRecipientRepository,
  ) {}

  async execute(request: GetStatsRequest): Promise<GetStatsResponse> {
    const dateFrom = request.dateFrom ? new Date(request.dateFrom) : undefined;
    const dateTo = request.dateTo ? new Date(request.dateTo) : undefined;

    // Obtener todos los mensajes en el rango de fechas
    const result = await this.messageRepository.findMany({
      dateFrom,
      dateTo,
      limit: 10000, // Obtener todos
    });

    // Calcular estadísticas
    let totalSent = 0;
    let totalDelivered = 0;
    let totalRead = 0;
    let totalFailed = 0;
    let totalReadTime = 0;
    let readCount = 0;

    const messagesByType: Record<string, number> = {
      urgent: 0,
      informative: 0,
      promotional: 0,
      payment_reminder: 0,
      general: 0,
    };

    const messagesByChannel: Record<string, number> = {
      notification: 0,
      email: 0,
      whatsapp: 0,
      sms: 0,
    };

    for (const message of result.messages) {
      // Contar por tipo
      messagesByType[message.type] = (messagesByType[message.type] || 0) + 1;

      // Contar por canal
      messagesByChannel[message.channel] = (messagesByChannel[message.channel] || 0) + 1;

      // Obtener estadísticas de entrega
      const stats = await this.recipientRepository.getDeliveryStats(message.id);
      totalSent += stats.sent;
      totalDelivered += stats.delivered;
      totalRead += stats.read;
      totalFailed += stats.failed;

      // Calcular tiempo promedio de lectura
      if (stats.read > 0) {
        const recipients = await this.recipientRepository.findByMessageId(message.id, 'read');
        for (const recipient of recipients) {
          if (recipient.deliveredAt && recipient.readAt) {
            const readTime =
              (recipient.readAt.getTime() - recipient.deliveredAt.getTime()) / (1000 * 60 * 60); // Convertir a horas
            totalReadTime += readTime;
            readCount++;
          }
        }
      }
    }

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const readRate = totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0;
    const averageReadTime = readCount > 0 ? totalReadTime / readCount : 0;

    return new GetStatsResponse(
      totalSent,
      totalDelivered,
      totalRead,
      totalFailed,
      deliveryRate,
      readRate,
      averageReadTime,
      messagesByType,
      messagesByChannel,
    );
  }
}
