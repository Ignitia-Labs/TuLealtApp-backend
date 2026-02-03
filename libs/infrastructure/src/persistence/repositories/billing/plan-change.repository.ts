import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPlanChangeRepository, PlanChange } from '@libs/domain';
import { PlanChangeEntity } from '@libs/infrastructure/entities/billing/plan-change.entity';
import { PlanChangeMapper } from '@libs/infrastructure/mappers/billing/plan-change.mapper';

/**
 * Implementación del repositorio de PlanChange usando TypeORM
 */
@Injectable()
export class PlanChangeRepository implements IPlanChangeRepository {
  constructor(
    @InjectRepository(PlanChangeEntity)
    private readonly planChangeRepository: Repository<PlanChangeEntity>,
  ) {}

  async findById(id: number): Promise<PlanChange | null> {
    const entity = await this.planChangeRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return PlanChangeMapper.toDomain(entity);
  }

  async findBySubscriptionId(subscriptionId: number): Promise<PlanChange[]> {
    const entities = await this.planChangeRepository.find({
      where: { subscriptionId },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => PlanChangeMapper.toDomain(entity));
  }

  async findPendingBySubscriptionId(subscriptionId: number): Promise<PlanChange[]> {
    const entities = await this.planChangeRepository.find({
      where: { subscriptionId, status: 'pending' },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => PlanChangeMapper.toDomain(entity));
  }

  async save(planChange: PlanChange): Promise<PlanChange> {
    const entity = PlanChangeMapper.toPersistence(planChange);
    const savedEntity = await this.planChangeRepository.save(entity);
    return PlanChangeMapper.toDomain(savedEntity);
  }

  async update(planChange: PlanChange): Promise<PlanChange> {
    const entity = PlanChangeMapper.toPersistence(planChange);
    const updatedEntity = await this.planChangeRepository.save(entity);
    return PlanChangeMapper.toDomain(updatedEntity);
  }
}
