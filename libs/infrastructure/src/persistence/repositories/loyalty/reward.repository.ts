import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRewardRepository, Reward, IPointsTransactionRepository } from '@libs/domain';
import { RewardEntity } from '@libs/infrastructure/entities/loyalty/reward.entity';
import { RewardMapper } from '@libs/infrastructure/mappers/loyalty/reward.mapper';
import { PointsTransactionEntity } from '@libs/infrastructure/entities/loyalty/points-transaction.entity';
import { CustomerMembershipEntity } from '@libs/infrastructure/entities/customer/customer-membership.entity';

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
        // stock === -1 significa ilimitado, siempre disponible
        if (e.stock !== -1 && e.stock <= 0) return false;
        // validUntil === null significa válida de forma perpetua
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

      // Validar stock si se está reduciendo (excepto si es ilimitado)
      if (
        currentEntity.stock !== -1 &&
        reward.stock !== -1 &&
        currentEntity.stock <= 0 &&
        reward.stock <= 0
      ) {
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
    // Usar método optimizado con filtro directo en BD en lugar de filtrar en memoria
    const rewardRedemptions =
      await this.pointsTransactionRepository.findByMembershipIdAndTypeAndRewardId(
        membershipId,
        'REDEEM',
        rewardId,
      );

    return rewardRedemptions.length;
  }

  async countTotalRedemptions(rewardId: number): Promise<number> {
    // Usar COUNT() SQL directo para eficiencia, usando la columna tipada rewardId
    const result = await this.rewardRepository.manager
      .createQueryBuilder(PointsTransactionEntity, 'pt')
      .select('COUNT(pt.id)', 'count')
      .where('pt.type = :type', { type: 'REDEEM' })
      .andWhere('pt.rewardId = :rewardId', { rewardId })
      .getRawOne();

    return Number(result?.count || 0);
  }

  async countTotalRedemptionsBatch(rewardIds: number[]): Promise<Map<number, number>> {
    if (rewardIds.length === 0) {
      return new Map();
    }

    // Usar GROUP BY para obtener conteos de múltiples rewards en una sola query
    const results = await this.rewardRepository.manager
      .createQueryBuilder(PointsTransactionEntity, 'pt')
      .select('pt.rewardId', 'rewardId')
      .addSelect('COUNT(pt.id)', 'count')
      .where('pt.type = :type', { type: 'REDEEM' })
      .andWhere('pt.rewardId IN (:...rewardIds)', { rewardIds })
      .groupBy('pt.rewardId')
      .getRawMany();

    // Convertir resultados a Map
    const countsMap = new Map<number, number>();
    for (const row of results) {
      countsMap.set(Number(row.rewardId), Number(row.count || 0));
    }

    // Asegurar que todas las rewards tengan entrada (aunque sea 0)
    for (const rewardId of rewardIds) {
      if (!countsMap.has(rewardId)) {
        countsMap.set(rewardId, 0);
      }
    }

    return countsMap;
  }

  async getTopRedeemedRewardsByPeriod(
    tenantId: number,
    limit: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ rewardId: number; timesRedeemed: number }>> {
    // Query optimizada con JOIN a customer_memberships para filtrar por tenantId
    // Agrupa por rewardId y cuenta redemptions en el período
    const results = await this.rewardRepository.manager
      .createQueryBuilder(PointsTransactionEntity, 'pt')
      .innerJoin(CustomerMembershipEntity, 'cm', 'pt.membershipId = cm.id')
      .where('cm.tenantId = :tenantId', { tenantId })
      .andWhere('pt.type = :type', { type: 'REDEEM' })
      .andWhere('pt.rewardId IS NOT NULL')
      .andWhere('pt.createdAt >= :startDate', { startDate })
      .andWhere('pt.createdAt <= :endDate', { endDate })
      .select('pt.rewardId', 'rewardId')
      .addSelect('COUNT(pt.id)', 'timesRedeemed')
      .groupBy('pt.rewardId')
      .orderBy('timesRedeemed', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((row) => ({
      rewardId: Number(row.rewardId),
      timesRedeemed: Number(row.timesRedeemed || 0),
    }));
  }
}
