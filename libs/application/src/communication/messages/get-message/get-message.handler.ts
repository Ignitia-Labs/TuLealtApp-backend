import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IPartnerMessageRepository,
  IPartnerRepository,
  IUserRepository,
  IMessageRecipientRepository,
  IMessageTemplateRepository,
} from '@libs/domain';
import { GetMessageResponse } from './get-message.response';
import { MessageSenderService } from '../message-sender.service';

/**
 * Handler para obtener un mensaje por ID
 */
@Injectable()
export class GetMessageHandler {
  constructor(
    @Inject('IPartnerMessageRepository')
    private readonly messageRepository: IPartnerMessageRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IMessageRecipientRepository')
    private readonly recipientRepository: IMessageRecipientRepository,
    @Inject('IMessageTemplateRepository')
    private readonly templateRepository: IMessageTemplateRepository,
    private readonly messageSenderService: MessageSenderService,
  ) {}

  async execute(messageId: number): Promise<GetMessageResponse> {
    const message = await this.messageRepository.findById(messageId);

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    // Obtener destinatarios
    const recipients = await this.recipientRepository.findByMessageId(message.id);
    const partnerIds = recipients.map((r) => r.partnerId);
    const partnerNames: string[] = [];

    for (const partnerId of partnerIds) {
      const partner = await this.partnerRepository.findById(partnerId);
      if (partner) {
        partnerNames.push(partner.name);
      }
    }

    // Obtener información del sender
    const sender = await this.userRepository.findById(message.senderId);
    const senderName = sender ? sender.name : 'Unknown';
    const senderRole = sender?.roles?.[0] || 'unknown';

    // Obtener nombre del template si existe
    let templateName: string | null = null;
    if (message.templateId) {
      const template = await this.templateRepository.findById(message.templateId);
      templateName = template?.name || null;
    }

    // Obtener estadísticas de entrega
    const deliveryStats = await this.messageSenderService.getDeliveryStats(message.id);

    return new GetMessageResponse(
      message,
      partnerIds,
      partnerNames,
      senderName,
      senderRole,
      templateName,
      deliveryStats,
    );
  }
}
