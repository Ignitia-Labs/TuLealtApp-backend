import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISubscriptionAlertRepository, SubscriptionAlert } from '@libs/domain';
import { SubscriptionAlertEntity } from '@libs/infrastructure/entities/billing/subscription-alert.entity';
import { SubscriptionAlertMapper } from '@libs/infrastructure/mappers/billing/subscription-alert.mapper';

/**
 * Implementación del repositorio de SubscriptionAlert usando TypeORM
 */
@Injectable()
export class SubscriptionAlertRepository implements ISubscriptionAlertRepository {
  constructor(
    @InjectRepository(SubscriptionAlertEntity)
    private readonly subscriptionAlertRepository: Repository<SubscriptionAlertEntity>,
  ) {}

  async findById(id: number): Promise<SubscriptionAlert | null> {
    const entity = await this.subscriptionAlertRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return SubscriptionAlertMapper.toDomain(entity);
  }

  async findBySubscriptionId(subscriptionId: number): Promise<SubscriptionAlert[]> {
    const entities = await this.subscriptionAlertRepository.find({
      where: { subscriptionId },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => SubscriptionAlertMapper.toDomain(entity));
  }

  async findActiveBySubscriptionId(subscriptionId: number): Promise<SubscriptionAlert[]> {
    const entities = await this.subscriptionAlertRepository.find({
      where: { subscriptionId, status: 'active' },
      order: { severity: 'ASC', createdAt: 'DESC' },
    });

    return entities.map((entity) => SubscriptionAlertMapper.toDomain(entity));
  }

  async findBySeverity(
    subscriptionId: number,
    severity: 'info' | 'warning' | 'critical',
  ): Promise<SubscriptionAlert[]> {
    const entities = await this.subscriptionAlertRepository.find({
      where: { subscriptionId, severity },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => SubscriptionAlertMapper.toDomain(entity));
  }

  async save(alert: SubscriptionAlert): Promise<SubscriptionAlert> {
    const entity = SubscriptionAlertMapper.toPersistence(alert);
    const savedEntity = await this.subscriptionAlertRepository.save(entity);
    return SubscriptionAlertMapper.toDomain(savedEntity);
  }

  async update(alert: SubscriptionAlert): Promise<SubscriptionAlert> {
    const entity = SubscriptionAlertMapper.toPersistence(alert);
    const updatedEntity = await this.subscriptionAlertRepository.save(entity);
    return SubscriptionAlertMapper.toDomain(updatedEntity);
  }
}
