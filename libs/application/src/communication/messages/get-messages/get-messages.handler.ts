import { Injectable, Inject } from '@nestjs/common';
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
    @InjectRepository(PartnerEntity)
    private readonly partnerEntityRepository: Repository<PartnerEntity>,
    @InjectRepository(UserEntity)
    private readonly userEntityRepository: Repository<UserEntity>,
    @InjectRepository(MessageTemplateEntity)
    private readonly templateEntityRepository: Repository<MessageTemplateEntity>,
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

    // Optimizado: Agrupar todas las queries para evitar N+1
    const messageIds = result.messages.map((m) => m.id);
    const senderIds = [...new Set(result.messages.map((m) => m.senderId))];
    const templateIds = result.messages
      .map((m) => m.templateId)
      .filter((id): id is number => id !== null && id !== undefined);

    // Obtener todos los recipients de todos los mensajes en paralelo
    const allRecipientsPromises = messageIds.map((messageId) =>
      this.recipientRepository.findByMessageId(messageId),
    );
    const allRecipientsArrays = await Promise.all(allRecipientsPromises);

    // Crear mapa de recipients por messageId
    const recipientsByMessageId = new Map<number, (typeof allRecipientsArrays)[0]>();
    messageIds.forEach((messageId, index) => {
      recipientsByMessageId.set(messageId, allRecipientsArrays[index]);
    });

    // Obtener todos los partnerIds únicos
    const allPartnerIds = [
      ...new Set(allRecipientsArrays.flatMap((recipients) => recipients.map((r) => r.partnerId))),
    ];

    // Obtener todos los partners en una sola query
    const partnerEntities =
      allPartnerIds.length > 0
        ? await this.partnerEntityRepository.find({
            where: { id: In(allPartnerIds) },
            select: ['id', 'name'],
          })
        : [];
    const partnersMap = new Map(partnerEntities.map((p) => [p.id, p.name]));

    // Obtener todos los users en una sola query
    const userEntities =
      senderIds.length > 0
        ? await this.userEntityRepository.find({
            where: { id: In(senderIds) },
            select: ['id', 'name', 'roles'],
          })
        : [];
    const usersMap = new Map(
      userEntities.map((u) => [u.id, { name: u.name, role: u.roles?.[0] || 'unknown' }]),
    );

    // Obtener todos los templates en una sola query
    const templateEntities =
      templateIds.length > 0
        ? await this.templateEntityRepository.find({
            where: { id: In(templateIds) },
            select: ['id', 'name'],
          })
        : [];
    const templatesMap = new Map(templateEntities.map((t) => [t.id, t.name]));

    // Obtener todas las estadísticas de entrega en paralelo
    const deliveryStatsPromises = messageIds.map((messageId) =>
      this.messageSenderService.getDeliveryStats(messageId),
    );
    const allDeliveryStats = await Promise.all(deliveryStatsPromises);
    const deliveryStatsMap = new Map(
      messageIds.map((messageId, index) => [messageId, allDeliveryStats[index]]),
    );

    // Construir DTOs usando los datos en memoria
    const messageDtos = result.messages.map((message) => {
      const recipients = recipientsByMessageId.get(message.id) || [];
      const partnerIds = recipients.map((r) => r.partnerId);
      const partnerNames = partnerIds
        .map((partnerId) => partnersMap.get(partnerId))
        .filter((name): name is string => name !== undefined);

      const sender = usersMap.get(message.senderId);
      const senderName = sender?.name || 'Unknown';
      const senderRole = sender?.role || 'unknown';

      const templateName = message.templateId ? templatesMap.get(message.templateId) || null : null;
      const deliveryStats = deliveryStatsMap.get(message.id);

      return new MessageDto(
        message,
        partnerIds,
        partnerNames,
        senderName,
        senderRole,
        templateName,
        deliveryStats,
      );
    });

    return new GetMessagesResponse(
      messageDtos,
      request.page || 1,
      request.limit || 20,
      result.total,
    );
  }
}
