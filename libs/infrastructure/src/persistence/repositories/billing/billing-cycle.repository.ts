import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBillingCycleRepository, BillingCycle } from '@libs/domain';
import { BillingCycleEntity } from '@libs/infrastructure/entities/billing/billing-cycle.entity';
import { BillingCycleMapper } from '@libs/infrastructure/mappers/billing/billing-cycle.mapper';

/**
 * Implementación del repositorio de BillingCycle usando TypeORM
 */
@Injectable()
export class BillingCycleRepository implements IBillingCycleRepository {
  constructor(
    @InjectRepository(BillingCycleEntity)
    private readonly billingCycleRepository: Repository<BillingCycleEntity>,
  ) {}

  async findById(id: number): Promise<BillingCycle | null> {
    const entity = await this.billingCycleRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return BillingCycleMapper.toDomain(entity);
  }

  async findBySubscriptionId(subscriptionId: number): Promise<BillingCycle[]> {
    const entities = await this.billingCycleRepository.find({
      where: { subscriptionId },
      order: { cycleNumber: 'DESC' },
    });

    return entities.map((entity) => BillingCycleMapper.toDomain(entity));
  }

  async findPendingByPartnerId(partnerId: number): Promise<BillingCycle[]> {
    const entities = await this.billingCycleRepository.find({
      where: {
        partnerId,
        status: 'pending',
      },
      order: { dueDate: 'ASC' },
    });

    return entities.map((entity) => BillingCycleMapper.toDomain(entity));
  }

  async findByPartnerId(partnerId: number): Promise<BillingCycle[]> {
    const entities = await this.billingCycleRepository.find({
      where: { partnerId },
      order: { cycleNumber: 'DESC' },
    });

    return entities.map((entity) => BillingCycleMapper.toDomain(entity));
  }

  async findCurrentBySubscriptionId(subscriptionId: number): Promise<BillingCycle | null> {
    const now = new Date();
    const entity = await this.billingCycleRepository.findOne({
      where: {
        subscriptionId,
      },
      order: { cycleNumber: 'DESC' },
    });

    if (!entity) {
      return null;
    }

    const cycle = BillingCycleMapper.toDomain(entity);
    // Verificar si el ciclo actual está activo
    if (cycle.startDate <= now && cycle.endDate >= now) {
      return cycle;
    }

    return null;
  }

  async save(cycle: BillingCycle): Promise<BillingCycle> {
    const entity = BillingCycleMapper.toPersistence(cycle);
    const savedEntity = await this.billingCycleRepository.save(entity);
    return BillingCycleMapper.toDomain(savedEntity);
  }

  async update(cycle: BillingCycle): Promise<BillingCycle> {
    const entity = BillingCycleMapper.toPersistence(cycle);
    const updatedEntity = await this.billingCycleRepository.save(entity);
    return BillingCycleMapper.toDomain(updatedEntity);
  }

  async findPendingBySubscriptionId(subscriptionId: number): Promise<BillingCycle[]> {
    const entities = await this.billingCycleRepository.find({
      where: {
        subscriptionId,
        status: 'pending',
      },
      order: { dueDate: 'ASC' },
    });

    return entities.map((entity) => BillingCycleMapper.toDomain(entity));
  }

  async findWithRemainingBalance(
    subscriptionId: number,
    currency?: string,
  ): Promise<BillingCycle[]> {
    const where: any = {
      subscriptionId,
    };

    if (currency) {
      where.currency = currency;
    }

    const entities = await this.billingCycleRepository.find({
      where,
      order: { dueDate: 'ASC' },
    });

    // Filtrar solo los que tienen saldo pendiente
    return entities
      .map((entity) => BillingCycleMapper.toDomain(entity))
      .filter((cycle) => cycle.paidAmount < cycle.totalAmount);
  }

  async delete(id: number): Promise<void> {
    await this.billingCycleRepository.delete(id);
  }
}
