import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IPartnerMessageRepository,
  IMessageRecipientRepository,
  IPartnerRepository,
} from '@libs/domain';
import { UpdateRecipientStatusRequest } from './update-recipient-status.request';
import { UpdateRecipientStatusResponse } from './update-recipient-status.response';

/**
 * Handler para actualizar el estado de entrega de un destinatario específico
 */
@Injectable()
export class UpdateRecipientStatusHandler {
  constructor(
    @Inject('IPartnerMessageRepository')
    private readonly messageRepository: IPartnerMessageRepository,
    @Inject('IMessageRecipientRepository')
    private readonly recipientRepository: IMessageRecipientRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
  ) {}

  async execute(
    messageId: number,
    partnerId: number,
    request: UpdateRecipientStatusRequest,
  ): Promise<UpdateRecipientStatusResponse> {
    // Verificar que el mensaje exista
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    // Buscar el destinatario
    const recipient = await this.recipientRepository.findByMessageAndPartner(
      messageId,
      partnerId,
    );

    if (!recipient) {
      throw new NotFoundException(
        `Recipient not found for message ${messageId} and partner ${partnerId}`,
      );
    }

    // Parsear fechas si están presentes
    const deliveredAt = request.deliveredAt
      ? new Date(request.deliveredAt)
      : undefined;
    const readAt = request.readAt ? new Date(request.readAt) : undefined;

    // Validar fechas
    if (deliveredAt && isNaN(deliveredAt.getTime())) {
      throw new Error('Invalid deliveredAt format. Use ISO 8601 format.');
    }
    if (readAt && isNaN(readAt.getTime())) {
      throw new Error('Invalid readAt format. Use ISO 8601 format.');
    }

    // Actualizar el estado según el nuevo status
    let updatedRecipient;
    switch (request.status) {
      case 'delivered':
        updatedRecipient = recipient.markAsDelivered(deliveredAt);
        break;
      case 'read':
        updatedRecipient = recipient.markAsRead(readAt);
        break;
      case 'failed':
        if (!request.failureReason) {
          throw new Error('failureReason is required when status is "failed"');
        }
        updatedRecipient = recipient.markAsFailed(request.failureReason);
        break;
      case 'sent':
        updatedRecipient = recipient.updateStatus(
          'sent',
          deliveredAt || null,
          readAt || null,
          request.failureReason || null,
        );
        break;
      default:
        updatedRecipient = recipient.updateStatus(
          request.status,
          deliveredAt || null,
          readAt || null,
          request.failureReason || null,
        );
    }

    const savedRecipient = await this.recipientRepository.update(updatedRecipient);

    // Obtener información del partner
    const partner = await this.partnerRepository.findById(partnerId);

    return new UpdateRecipientStatusResponse(
      savedRecipient.messageId,
      savedRecipient.partnerId,
      partner?.name || 'Unknown',
      partner?.email || '',
      savedRecipient.status,
      savedRecipient.sentAt,
      savedRecipient.deliveredAt,
      savedRecipient.readAt,
      savedRecipient.failureReason,
    );
  }
}

