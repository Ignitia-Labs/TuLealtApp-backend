import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IMessageFilterRepository, MessageFilter } from '@libs/domain';
import { MessageFilterEntity } from '../entities/message-filter.entity';
import { MessageFilterMapper } from '../mappers/message-filter.mapper';

/**
 * Implementación del repositorio de MessageFilter usando TypeORM
 */
@Injectable()
export class MessageFilterRepository implements IMessageFilterRepository {
  constructor(
    @InjectRepository(MessageFilterEntity)
    private readonly filterRepository: Repository<MessageFilterEntity>,
  ) {}

  async findByMessageId(messageId: number): Promise<MessageFilter[]> {
    const entities = await this.filterRepository.find({
      where: { messageId },
    });

    return entities.map((entity) => MessageFilterMapper.toDomain(entity));
  }

  async saveMany(filters: MessageFilter[]): Promise<MessageFilter[]> {
    const entities = filters.map((filter) => MessageFilterMapper.toPersistence(filter));
    const savedEntities = await this.filterRepository.save(entities);
    return savedEntities.map((entity) => MessageFilterMapper.toDomain(entity));
  }

  async deleteByMessageId(messageId: number): Promise<void> {
    await this.filterRepository.delete({ messageId });
  }
}
