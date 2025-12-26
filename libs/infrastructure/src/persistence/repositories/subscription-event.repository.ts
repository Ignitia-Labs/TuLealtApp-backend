import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISubscriptionEventRepository, SubscriptionEvent } from '@libs/domain';
import { SubscriptionEventEntity } from '../entities/subscription-event.entity';
import { SubscriptionEventMapper } from '../mappers/subscription-event.mapper';

/**
 * Implementación del repositorio de SubscriptionEvent usando TypeORM
 */
@Injectable()
export class SubscriptionEventRepository implements ISubscriptionEventRepository {
  constructor(
    @InjectRepository(SubscriptionEventEntity)
    private readonly subscriptionEventRepository: Repository<SubscriptionEventEntity>,
  ) {}

  async findById(id: number): Promise<SubscriptionEvent | null> {
    const entity = await this.subscriptionEventRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return SubscriptionEventMapper.toDomain(entity);
  }

  async findBySubscriptionId(
    subscriptionId: number,
    skip = 0,
    take = 100,
  ): Promise<SubscriptionEvent[]> {
    const entities = await this.subscriptionEventRepository.find({
      where: { subscriptionId },
      skip,
      take,
      order: { occurredAt: 'DESC' },
    });

    return entities.map((entity) => SubscriptionEventMapper.toDomain(entity));
  }

  async findByType(
    subscriptionId: number,
    type: SubscriptionEvent['type'],
  ): Promise<SubscriptionEvent[]> {
    const entities = await this.subscriptionEventRepository.find({
      where: { subscriptionId, type },
      order: { occurredAt: 'DESC' },
    });

    return entities.map((entity) => SubscriptionEventMapper.toDomain(entity));
  }

  async save(event: SubscriptionEvent): Promise<SubscriptionEvent> {
    const entity = SubscriptionEventMapper.toPersistence(event);
    const savedEntity = await this.subscriptionEventRepository.save(entity);
    return SubscriptionEventMapper.toDomain(savedEntity);
  }
}
