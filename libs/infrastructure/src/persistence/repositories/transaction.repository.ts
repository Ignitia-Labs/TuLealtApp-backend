import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ITransactionRepository, Transaction, RecentTransaction } from '@libs/domain';
import { TransactionEntity } from '../entities/transaction.entity';
import { TransactionMapper } from '../mappers/transaction.mapper';
import { CustomerMembershipEntity } from '../entities/customer-membership.entity';

/**
 * Implementación del repositorio de Transaction usando TypeORM
 */
@Injectable()
export class TransactionRepository implements ITransactionRepository {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
  ) {}

  async findById(id: number): Promise<Transaction | null> {
    const entity = await this.transactionRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return TransactionMapper.toDomain(entity);
  }

  async findByUserId(userId: number, skip = 0, take = 100): Promise<Transaction[]> {
    const entities = await this.transactionRepository.find({
      where: { userId },
      skip,
      take,
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => TransactionMapper.toDomain(entity));
  }

  async findByMembershipId(membershipId: number, skip = 0, take = 100): Promise<Transaction[]> {
    const entities = await this.transactionRepository.find({
      where: { membershipId },
      skip,
      take,
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => TransactionMapper.toDomain(entity));
  }

  async findByType(
    userId: number,
    type: 'earn' | 'redeem' | 'expire' | 'adjust',
  ): Promise<Transaction[]> {
    const entities = await this.transactionRepository.find({
      where: { userId, type },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => TransactionMapper.toDomain(entity));
  }

  async findByTypeAndMembershipId(
    membershipId: number,
    type: 'earn' | 'redeem' | 'expire' | 'adjust',
  ): Promise<Transaction[]> {
    const entities = await this.transactionRepository.find({
      where: { membershipId, type },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => TransactionMapper.toDomain(entity));
  }

  async save(transaction: Transaction): Promise<Transaction> {
    const entity = TransactionMapper.toPersistence(transaction);
    const savedEntity = await this.transactionRepository.save(entity);
    return TransactionMapper.toDomain(savedEntity);
  }

  async countByUserId(userId: number): Promise<number> {
    return this.transactionRepository.count({
      where: { userId },
    });
  }

  async getStatsByTenantId(tenantId: number): Promise<{
    pointsEarned: number;
    pointsRedeemed: number;
    totalRedemptions: number;
  }> {
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .innerJoin(CustomerMembershipEntity, 'membership', 'membership.id = transaction.membershipId')
      .select([
        'SUM(CASE WHEN transaction.type = :earnType AND transaction.status = :completedStatus THEN transaction.points ELSE 0 END) as pointsEarned',
        'SUM(CASE WHEN transaction.type = :redeemType AND transaction.status = :completedStatus THEN ABS(transaction.points) ELSE 0 END) as pointsRedeemed',
        'COUNT(CASE WHEN transaction.type = :redeemType AND transaction.status = :completedStatus THEN 1 END) as totalRedemptions',
      ])
      .where('membership.tenantId = :tenantId', { tenantId })
      .setParameter('earnType', 'earn')
      .setParameter('redeemType', 'redeem')
      .setParameter('completedStatus', 'completed')
      .getRawOne();

    return {
      pointsEarned: parseInt(result?.pointsEarned || '0', 10),
      pointsRedeemed: parseInt(result?.pointsRedeemed || '0', 10),
      totalRedemptions: parseInt(result?.totalRedemptions || '0', 10),
    };
  }

  async getRecentTransactionsByTenantId(
    tenantId: number,
    limit: number,
  ): Promise<RecentTransaction[]> {
    const entities = await this.transactionRepository
      .createQueryBuilder('transaction')
      .innerJoin(CustomerMembershipEntity, 'membership', 'membership.id = transaction.membershipId')
      .where('membership.tenantId = :tenantId', { tenantId })
      .andWhere('transaction.status = :status', { status: 'completed' })
      .orderBy('transaction.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    return entities.map((entity) => ({
      id: entity.id,
      type: entity.type,
      points: entity.points,
      description: entity.description,
      createdAt: entity.createdAt,
    }));
  }
}
