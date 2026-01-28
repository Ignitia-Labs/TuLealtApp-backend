import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRewardRepository, Reward, TopReward } from '@libs/domain';
import { RewardEntity } from '../entities/reward.entity';
import { RewardMapper } from '../mappers/reward.mapper';
import { TransactionEntity } from '../entities/transaction.entity';
import { CustomerMembershipEntity } from '../entities/customer-membership.entity';

/**
 * Implementación del repositorio de Reward usando TypeORM
 */
@Injectable()
export class RewardRepository implements IRewardRepository {
  constructor(
    @InjectRepository(RewardEntity)
    private readonly rewardRepository: Repository<RewardEntity>,
  ) {}

  async findById(id: number): Promise<Reward | null> {
    const entity = await this.rewardRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return RewardMapper.toDomain(entity);
  }

  async findByTenantId(tenantId: number): Promise<Reward[]> {
    const entities = await this.rewardRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => RewardMapper.toDomain(entity));
  }

  async findByCategory(tenantId: number, category: string): Promise<Reward[]> {
    const entities = await this.rewardRepository.find({
      where: { tenantId, category },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => RewardMapper.toDomain(entity));
  }

  async findAvailable(tenantId: number): Promise<Reward[]> {
    const entities = await this.rewardRepository.find({
      where: {
        tenantId,
        status: 'active',
      },
      order: { createdAt: 'DESC' },
    });

    return entities
      .map((entity) => RewardMapper.toDomain(entity))
      .filter((reward) => reward.isAvailable() && !reward.isExpired());
  }

  async save(reward: Reward): Promise<Reward> {
    const entity = RewardMapper.toPersistence(reward);
    const savedEntity = await this.rewardRepository.save(entity);
    return RewardMapper.toDomain(savedEntity);
  }

  async update(reward: Reward): Promise<Reward> {
    const entity = RewardMapper.toPersistence(reward);
    const updatedEntity = await this.rewardRepository.save(entity);
    return RewardMapper.toDomain(updatedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.rewardRepository.delete(id);
  }

  async getTopRewardsByTenantId(tenantId: number, limit: number): Promise<TopReward[]> {
    // Nota: Las transacciones no tienen un campo directo rewardId.
    // Por ahora, obtenemos los rewards activos más populares basándonos en puntos requeridos
    // y fecha de creación. En el futuro, podemos mejorar esto si agregamos tracking de rewardId
    // en las transacciones o en el metadata.
    const rewards = await this.rewardRepository.find({
      where: {
        tenantId,
        status: 'active',
      },
      order: {
        pointsRequired: 'ASC', // Rewards con menos puntos primero (más accesibles)
        createdAt: 'DESC',
      },
      take: limit,
    });

    // Por ahora, asignamos un conteo de redemptions basado en una aproximación
    // En el futuro, esto debería contar transacciones reales relacionadas con cada reward
    return rewards.map((reward) => ({
      rewardId: reward.id,
      rewardName: reward.name,
      redemptionsCount: 0, // TODO: Implementar conteo real cuando tengamos rewardId en transacciones
      pointsRequired: reward.pointsRequired,
    }));
  }
}
