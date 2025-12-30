import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPartnerMessageRepository } from '@libs/domain';
import { UpdateMessageRequest } from './update-message.request';
import { UpdateMessageResponse } from './update-message.response';
import { MessageSenderService } from '../message-sender.service';

/**
 * Handler para actualizar un mensaje (solo si está en estado draft)
 */
@Injectable()
export class UpdateMessageHandler {
  constructor(
    @Inject('IPartnerMessageRepository')
    private readonly messageRepository: IPartnerMessageRepository,
    private readonly messageSenderService: MessageSenderService,
  ) {}

  async execute(
    messageId: number,
    request: UpdateMessageRequest,
  ): Promise<UpdateMessageResponse> {
    const message = await this.messageRepository.findById(messageId);

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    // Validar que el mensaje esté en estado draft
    if (!message.canBeEdited()) {
      throw new BadRequestException(
        `Message with ID ${messageId} cannot be edited. Only draft messages can be edited.`,
      );
    }

    // Convertir attachments DTO a Attachment si están presentes
    const attachments = request.attachments
      ? request.attachments
          .filter(
            (att) =>
              att.id && att.name && att.type && att.size !== undefined && att.url,
          )
          .map((att) => ({
            id: att.id!,
            name: att.name!,
            type: att.type!,
            size: att.size!,
            url: att.url!,
          }))
      : undefined;

    // Actualizar el mensaje
    const updatedMessage = message.update(
      request.subject,
      request.body,
      request.notes,
      request.tags,
      attachments,
    );

    const savedMessage = await this.messageRepository.update(updatedMessage);

    // Obtener estadísticas de entrega
    const deliveryStats = await this.messageSenderService.getDeliveryStats(
      savedMessage.id,
    );

    return new UpdateMessageResponse(savedMessage, deliveryStats);
  }
}

