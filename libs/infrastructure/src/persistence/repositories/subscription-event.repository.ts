import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  ISubscriptionEventRepository,
  SubscriptionEvent,
  SubscriptionEventType,
} from '@libs/domain';
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

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    filters?: {
      subscriptionId?: number;
      partnerId?: number;
      type?: SubscriptionEventType;
    },
    skip?: number,
    take?: number,
  ): Promise<SubscriptionEvent[]> {
    const queryBuilder = this.subscriptionEventRepository
      .createQueryBuilder('event')
      .where('event.occurredAt >= :startDate', { startDate })
      .andWhere('event.occurredAt <= :endDate', { endDate });

    if (filters?.subscriptionId) {
      queryBuilder.andWhere('event.subscriptionId = :subscriptionId', {
        subscriptionId: filters.subscriptionId,
      });
    }

    if (filters?.partnerId) {
      queryBuilder.andWhere('event.partnerId = :partnerId', {
        partnerId: filters.partnerId,
      });
    }

    if (filters?.type) {
      queryBuilder.andWhere('event.type = :type', { type: filters.type });
    }

    queryBuilder.orderBy('event.occurredAt', 'DESC');

    if (skip !== undefined) {
      queryBuilder.skip(skip);
    }

    if (take !== undefined) {
      queryBuilder.take(take);
    }

    const entities = await queryBuilder.getMany();
    return entities.map((entity) => SubscriptionEventMapper.toDomain(entity));
  }

  async countByDateRange(
    startDate: Date,
    endDate: Date,
    filters?: {
      subscriptionId?: number;
      partnerId?: number;
      type?: SubscriptionEventType;
    },
  ): Promise<number> {
    const queryBuilder = this.subscriptionEventRepository
      .createQueryBuilder('event')
      .where('event.occurredAt >= :startDate', { startDate })
      .andWhere('event.occurredAt <= :endDate', { endDate });

    if (filters?.subscriptionId) {
      queryBuilder.andWhere('event.subscriptionId = :subscriptionId', {
        subscriptionId: filters.subscriptionId,
      });
    }

    if (filters?.partnerId) {
      queryBuilder.andWhere('event.partnerId = :partnerId', {
        partnerId: filters.partnerId,
      });
    }

    if (filters?.type) {
      queryBuilder.andWhere('event.type = :type', { type: filters.type });
    }

    return queryBuilder.getCount();
  }

  async save(event: SubscriptionEvent): Promise<SubscriptionEvent> {
    const entity = SubscriptionEventMapper.toPersistence(event);
    const savedEntity = await this.subscriptionEventRepository.save(entity);
    return SubscriptionEventMapper.toDomain(savedEntity);
  }
}
