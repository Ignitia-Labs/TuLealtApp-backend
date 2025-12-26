import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRewardRepository, Reward } from '@libs/domain';
import { RewardEntity } from '../entities/reward.entity';
import { RewardMapper } from '../mappers/reward.mapper';

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
}
