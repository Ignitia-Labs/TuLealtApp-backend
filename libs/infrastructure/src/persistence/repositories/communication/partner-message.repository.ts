import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import {
  IPartnerMessageRepository,
  PartnerMessage,
  MessageType,
  MessageChannel,
  RecipientType,
  MessageStatus,
} from '@libs/domain';
import { PartnerMessageEntity } from '@libs/infrastructure/entities/communication/partner-message.entity';
import { PartnerMessageMapper } from '@libs/infrastructure/mappers/communication/partner-message.mapper';

/**
 * Implementación del repositorio de PartnerMessage usando TypeORM
 */
@Injectable()
export class PartnerMessageRepository implements IPartnerMessageRepository {
  constructor(
    @InjectRepository(PartnerMessageEntity)
    private readonly messageRepository: Repository<PartnerMessageEntity>,
  ) {}

  async findById(id: number): Promise<PartnerMessage | null> {
    const entity = await this.messageRepository.findOne({
      where: { id },
      relations: ['sender', 'template'],
    });

    if (!entity) {
      return null;
    }

    return PartnerMessageMapper.toDomain(entity);
  }

  async findMany(options?: {
    page?: number;
    limit?: number;
    type?: MessageType;
    channel?: MessageChannel;
    status?: MessageStatus;
    recipientType?: RecipientType;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    partnerId?: number;
    senderId?: number;
  }): Promise<{ messages: PartnerMessage[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.template', 'template')
      .leftJoinAndSelect('message.recipients', 'recipients')
      .leftJoinAndSelect('recipients.partner', 'partner');

    if (options?.type) {
      queryBuilder.andWhere('message.type = :type', { type: options.type });
    }

    if (options?.channel) {
      queryBuilder.andWhere('message.channel = :channel', {
        channel: options.channel,
      });
    }

    if (options?.status) {
      queryBuilder.andWhere('message.status = :status', {
        status: options.status,
      });
    }

    if (options?.recipientType) {
      queryBuilder.andWhere('message.recipientType = :recipientType', {
        recipientType: options.recipientType,
      });
    }

    if (options?.dateFrom) {
      queryBuilder.andWhere('message.createdAt >= :dateFrom', {
        dateFrom: options.dateFrom,
      });
    }

    if (options?.dateTo) {
      queryBuilder.andWhere('message.createdAt <= :dateTo', {
        dateTo: options.dateTo,
      });
    }

    if (options?.search) {
      queryBuilder.andWhere('(message.subject LIKE :search OR message.body LIKE :search)', {
        search: `%${options.search}%`,
      });
    }

    if (options?.senderId) {
      queryBuilder.andWhere('message.senderId = :senderId', {
        senderId: options.senderId,
      });
    }

    if (options?.partnerId) {
      queryBuilder.andWhere('recipients.partnerId = :partnerId', {
        partnerId: options.partnerId,
      });
    }

    queryBuilder.orderBy('message.createdAt', 'DESC');

    const [entities, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    const messages = entities.map((entity) => PartnerMessageMapper.toDomain(entity));

    return { messages, total };
  }

  async findScheduledMessages(now: Date): Promise<PartnerMessage[]> {
    const entities = await this.messageRepository.find({
      where: {
        status: 'draft',
        scheduledAt: LessThanOrEqual(now),
      },
      relations: ['sender', 'template', 'recipients'],
    });

    return entities.map((entity) => PartnerMessageMapper.toDomain(entity));
  }

  async save(message: PartnerMessage): Promise<PartnerMessage> {
    const entity = PartnerMessageMapper.toPersistence(message);
    const savedEntity = await this.messageRepository.save(entity);
    return PartnerMessageMapper.toDomain(savedEntity);
  }

  async update(message: PartnerMessage): Promise<PartnerMessage> {
    const entity = PartnerMessageMapper.toPersistence(message);
    const updatedEntity = await this.messageRepository.save(entity);
    return PartnerMessageMapper.toDomain(updatedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.messageRepository.delete(id);
  }
}
