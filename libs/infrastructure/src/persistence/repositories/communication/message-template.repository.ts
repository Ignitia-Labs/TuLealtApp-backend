import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { IMessageTemplateRepository, MessageTemplate, MessageTemplateType } from '@libs/domain';
import { MessageTemplateEntity } from '@libs/infrastructure/entities/communication/message-template.entity';
import { MessageTemplateMapper } from '@libs/infrastructure/mappers/communication/message-template.mapper';

/**
 * Implementación del repositorio de MessageTemplate usando TypeORM
 */
@Injectable()
export class MessageTemplateRepository implements IMessageTemplateRepository {
  constructor(
    @InjectRepository(MessageTemplateEntity)
    private readonly templateRepository: Repository<MessageTemplateEntity>,
  ) {}

  async findById(id: number): Promise<MessageTemplate | null> {
    const entity = await this.templateRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return MessageTemplateMapper.toDomain(entity);
  }

  async findAll(options?: {
    type?: MessageTemplateType;
    isActive?: boolean;
    search?: string;
  }): Promise<MessageTemplate[]> {
    const queryBuilder = this.templateRepository.createQueryBuilder('template');

    if (options?.type) {
      queryBuilder.andWhere('template.type = :type', { type: options.type });
    }

    if (options?.isActive !== undefined) {
      queryBuilder.andWhere('template.isActive = :isActive', {
        isActive: options.isActive,
      });
    }

    if (options?.search) {
      queryBuilder.andWhere('template.name LIKE :search', {
        search: `%${options.search}%`,
      });
    }

    queryBuilder.orderBy('template.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();
    return entities.map((entity) => MessageTemplateMapper.toDomain(entity));
  }

  async save(template: MessageTemplate): Promise<MessageTemplate> {
    const entity = MessageTemplateMapper.toPersistence(template);
    const savedEntity = await this.templateRepository.save(entity);
    return MessageTemplateMapper.toDomain(savedEntity);
  }

  async update(template: MessageTemplate): Promise<MessageTemplate> {
    const entity = MessageTemplateMapper.toPersistence(template);
    const updatedEntity = await this.templateRepository.save(entity);
    return MessageTemplateMapper.toDomain(updatedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.templateRepository.delete(id);
  }
}
