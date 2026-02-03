import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IMessageRecipientRepository, MessageRecipient, RecipientStatus } from '@libs/domain';
import { MessageRecipientEntity } from '@libs/infrastructure/entities/communication/message-recipient.entity';
import { MessageRecipientMapper } from '@libs/infrastructure/mappers/communication/message-recipient.mapper';

/**
 * Implementación del repositorio de MessageRecipient usando TypeORM
 */
@Injectable()
export class MessageRecipientRepository implements IMessageRecipientRepository {
  constructor(
    @InjectRepository(MessageRecipientEntity)
    private readonly recipientRepository: Repository<MessageRecipientEntity>,
  ) {}

  async findById(id: number): Promise<MessageRecipient | null> {
    const entity = await this.recipientRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return MessageRecipientMapper.toDomain(entity);
  }

  async findByMessageId(messageId: number, status?: RecipientStatus): Promise<MessageRecipient[]> {
    const where: any = { messageId };
    if (status) {
      where.status = status;
    }

    const entities = await this.recipientRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => MessageRecipientMapper.toDomain(entity));
  }

  async findByPartnerId(partnerId: number): Promise<MessageRecipient[]> {
    const entities = await this.recipientRepository.find({
      where: { partnerId },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => MessageRecipientMapper.toDomain(entity));
  }

  async findByMessageAndPartner(
    messageId: number,
    partnerId: number,
  ): Promise<MessageRecipient | null> {
    const entity = await this.recipientRepository.findOne({
      where: { messageId, partnerId },
    });

    if (!entity) {
      return null;
    }

    return MessageRecipientMapper.toDomain(entity);
  }

  async saveMany(recipients: MessageRecipient[]): Promise<MessageRecipient[]> {
    const entities = recipients.map((recipient) => MessageRecipientMapper.toPersistence(recipient));
    const savedEntities = await this.recipientRepository.save(entities);
    return savedEntities.map((entity) => MessageRecipientMapper.toDomain(entity));
  }

  async save(recipient: MessageRecipient): Promise<MessageRecipient> {
    const entity = MessageRecipientMapper.toPersistence(recipient);
    const savedEntity = await this.recipientRepository.save(entity);
    return MessageRecipientMapper.toDomain(savedEntity);
  }

  async update(recipient: MessageRecipient): Promise<MessageRecipient> {
    const entity = MessageRecipientMapper.toPersistence(recipient);
    const updatedEntity = await this.recipientRepository.save(entity);
    return MessageRecipientMapper.toDomain(updatedEntity);
  }

  async getDeliveryStats(messageId: number): Promise<{
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  }> {
    const stats = await this.recipientRepository
      .createQueryBuilder('recipient')
      .select('recipient.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('recipient.messageId = :messageId', { messageId })
      .groupBy('recipient.status')
      .getRawMany();

    const result = {
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
    };

    stats.forEach((stat) => {
      const count = parseInt(stat.count, 10);
      switch (stat.status) {
        case 'sent':
          result.sent = count;
          break;
        case 'delivered':
          result.delivered = count;
          break;
        case 'read':
          result.read = count;
          break;
        case 'failed':
          result.failed = count;
          break;
      }
    });

    // Los mensajes leídos también cuentan como entregados
    if (result.read > 0) {
      result.delivered += result.read;
    }

    return result;
  }
}
