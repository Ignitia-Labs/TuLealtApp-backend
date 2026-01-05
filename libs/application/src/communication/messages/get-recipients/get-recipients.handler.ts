import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IPartnerMessageRepository,
  IMessageRecipientRepository,
  IPartnerRepository,
} from '@libs/domain';
import { GetRecipientsRequest } from './get-recipients.request';
import { GetRecipientsResponse, RecipientDto } from './get-recipients.response';

/**
 * Handler para obtener destinatarios de un mensaje
 */
@Injectable()
export class GetRecipientsHandler {
  constructor(
    @Inject('IPartnerMessageRepository')
    private readonly messageRepository: IPartnerMessageRepository,
    @Inject('IMessageRecipientRepository')
    private readonly recipientRepository: IMessageRecipientRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
  ) {}

  async execute(messageId: number, request: GetRecipientsRequest): Promise<GetRecipientsResponse> {
    // Verificar que el mensaje exista
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    // Obtener destinatarios
    const recipients = await this.recipientRepository.findByMessageId(messageId, request.status);

    // Enriquecer con información del partner
    const recipientDtos = await Promise.all(
      recipients.map(async (recipient) => {
        const partner = await this.partnerRepository.findById(recipient.partnerId);
        return new RecipientDto(
          recipient.messageId,
          recipient.partnerId,
          partner?.name || 'Unknown',
          partner?.email || '',
          recipient.status,
          recipient.sentAt,
          recipient.deliveredAt,
          recipient.readAt,
          recipient.failureReason,
        );
      }),
    );

    return new GetRecipientsResponse(recipientDtos, recipientDtos.length);
  }
}
