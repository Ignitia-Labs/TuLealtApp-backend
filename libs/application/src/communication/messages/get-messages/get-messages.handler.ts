import { Injectable, Inject } from '@nestjs/common';
import {
  IPartnerMessageRepository,
  IPartnerRepository,
  IUserRepository,
  IMessageRecipientRepository,
  IMessageTemplateRepository,
} from '@libs/domain';
import { GetMessagesRequest } from './get-messages.request';
import { GetMessagesResponse, MessageDto } from './get-messages.response';
import { MessageSenderService } from '../message-sender.service';

/**
 * Handler para obtener mensajes
 */
@Injectable()
export class GetMessagesHandler {
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

  async execute(request: GetMessagesRequest): Promise<GetMessagesResponse> {
    const dateFrom = request.dateFrom ? new Date(request.dateFrom) : undefined;
    const dateTo = request.dateTo ? new Date(request.dateTo) : undefined;

    const result = await this.messageRepository.findMany({
      page: request.page,
      limit: request.limit,
      type: request.type,
      channel: request.channel,
      status: request.status,
      recipientType: request.recipientType,
      dateFrom,
      dateTo,
      search: request.search,
      partnerId: request.partnerId,
      senderId: request.senderId,
    });

    // Enriquecer mensajes con información adicional
    const messageDtos = await Promise.all(
      result.messages.map(async (message) => {
        // Obtener destinatarios
        const recipients = await this.recipientRepository.findByMessageId(
          message.id,
        );

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
          const template = await this.templateRepository.findById(
            message.templateId,
          );
          templateName = template?.name || null;
        }

        // Obtener estadísticas de entrega
        const deliveryStats = await this.messageSenderService.getDeliveryStats(
          message.id,
        );

        return new MessageDto(
          message,
          partnerIds,
          partnerNames,
          senderName,
          senderRole,
          templateName,
          deliveryStats,
        );
      }),
    );

    return new GetMessagesResponse(
      messageDtos,
      request.page || 1,
      request.limit || 20,
      result.total,
    );
  }
}

