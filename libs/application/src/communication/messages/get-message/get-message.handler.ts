import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  IPartnerMessageRepository,
  IPartnerRepository,
  IUserRepository,
  IMessageRecipientRepository,
  IMessageTemplateRepository,
} from '@libs/domain';
import { PartnerEntity, UserEntity, MessageTemplateEntity } from '@libs/infrastructure';
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
    @InjectRepository(PartnerEntity)
    private readonly partnerEntityRepository: Repository<PartnerEntity>,
    @InjectRepository(UserEntity)
    private readonly userEntityRepository: Repository<UserEntity>,
    @InjectRepository(MessageTemplateEntity)
    private readonly templateEntityRepository: Repository<MessageTemplateEntity>,
    private readonly messageSenderService: MessageSenderService,
  ) {}

  async execute(messageId: number): Promise<GetMessageResponse> {
    const message = await this.messageRepository.findById(messageId);

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    // Optimizado: Obtener todos los datos en paralelo en lugar de queries secuenciales
    const recipients = await this.recipientRepository.findByMessageId(message.id);
    const partnerIds = recipients.map((r) => r.partnerId);

    // Obtener partners, sender y template en paralelo
    const [partnerEntities, senderEntity, templateEntity] = await Promise.all([
      // Obtener todos los partners en una sola query
      partnerIds.length > 0
        ? this.partnerEntityRepository.find({
            where: { id: In(partnerIds) },
            select: ['id', 'name'],
          })
        : Promise.resolve([]),
      // Obtener sender
      this.userEntityRepository.findOne({
        where: { id: message.senderId },
        select: ['id', 'name', 'roles'],
      }),
      // Obtener template si existe
      message.templateId
        ? this.templateEntityRepository.findOne({
            where: { id: message.templateId },
            select: ['id', 'name'],
          })
        : Promise.resolve(null),
    ]);

    const partnerNames = partnerEntities.map((p) => p.name);
    const senderName = senderEntity?.name || 'Unknown';
    const senderRole = senderEntity?.roles?.[0] || 'unknown';
    const templateName = templateEntity?.name || null;

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
