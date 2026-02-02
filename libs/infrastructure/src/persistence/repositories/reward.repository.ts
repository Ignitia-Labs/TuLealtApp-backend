import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRewardRepository, Reward, IPointsTransactionRepository } from '@libs/domain';
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
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
  ) {}

  async findById(id: number): Promise<Reward | null> {
    const entity = await this.rewardRepository.findOne({ where: { id } });
    return entity ? RewardMapper.toDomain(entity) : null;
  }

  async findByTenantId(tenantId: number): Promise<Reward[]> {
    const entities = await this.rewardRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    return entities.map(RewardMapper.toDomain);
  }

  async findAvailableByTenantId(tenantId: number): Promise<Reward[]> {
    const now = new Date();
    const entities = await this.rewardRepository.find({
      where: {
        tenantId,
        status: 'active',
      },
    });

    return entities
      .filter((e) => {
        if (e.stock <= 0) return false;
        if (e.validUntil && e.validUntil < now) return false;
        return true;
      })
      .map(RewardMapper.toDomain);
  }

  async findByCategory(tenantId: number, category: string): Promise<Reward[]> {
    const entities = await this.rewardRepository.find({
      where: { tenantId, category },
      order: { pointsRequired: 'ASC' },
    });
    return entities.map(RewardMapper.toDomain);
  }

  async save(reward: Reward): Promise<Reward> {
    const entityData = RewardMapper.toPersistence(reward);
    const savedEntity = await this.rewardRepository.save(entityData);
    return RewardMapper.toDomain(savedEntity);
  }

  async update(reward: Reward): Promise<Reward> {
    // Verificar que existe
    const existingEntity = await this.rewardRepository.findOne({
      where: { id: reward.id },
    });
    if (!existingEntity) {
      throw new Error(`Reward with ID ${reward.id} not found`);
    }

    // Usar transacción para atomicidad (importante para reducir stock concurrente)
    return await this.rewardRepository.manager.transaction(async (manager) => {
      // Re-verificar stock dentro de la transacción (optimistic locking)
      const currentEntity = await manager.findOne(RewardEntity, {
        where: { id: reward.id },
      });
      if (!currentEntity) {
        throw new Error(`Reward ${reward.id} not found`);
      }

      // Validar stock si se está reduciendo
      if (currentEntity.stock <= 0 && reward.stock <= 0) {
        throw new Error('Reward is out of stock');
      }

      const entityData = RewardMapper.toPersistence(reward);
      const updatedEntity = await manager.save(RewardEntity, entityData);
      return RewardMapper.toDomain(updatedEntity);
    });
  }

  async delete(id: number): Promise<void> {
    await this.rewardRepository.delete(id);
  }

  async countRedemptionsByUser(rewardId: number, membershipId: number): Promise<number> {
    // Obtener todas las transacciones REDEEM de esta membership
    const redeemTransactions = await this.pointsTransactionRepository.findByMembershipIdAndType(
      membershipId,
      'REDEEM',
    );

    // Filtrar solo las que corresponden a esta recompensa específica
    // (verificando metadata.rewardId)
    const rewardRedemptions = redeemTransactions.filter(
      (tx) => tx.metadata && tx.metadata.rewardId === rewardId,
    );

    return rewardRedemptions.length;
  }
}
