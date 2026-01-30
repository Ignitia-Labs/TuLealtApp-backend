import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { IPointsTransactionRepository, PointsTransaction } from '@libs/domain';
import { PointsTransactionEntity } from '../entities/points-transaction.entity';
import { PointsTransactionMapper } from '../mappers/points-transaction.mapper';

/**
 * Implementación del repositorio de PointsTransaction usando TypeORM
 */
@Injectable()
export class PointsTransactionRepository implements IPointsTransactionRepository {
  constructor(
    @InjectRepository(PointsTransactionEntity)
    private readonly pointsTransactionRepository: Repository<PointsTransactionEntity>,
  ) {}

  async save(transaction: PointsTransaction): Promise<PointsTransaction> {
    const entity = PointsTransactionMapper.toPersistence(transaction);
    const savedEntity = await this.pointsTransactionRepository.save(entity);
    return PointsTransactionMapper.toDomain(savedEntity);
  }

  async findById(id: number): Promise<PointsTransaction | null> {
    const entity = await this.pointsTransactionRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return PointsTransactionMapper.toDomain(entity);
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<PointsTransaction | null> {
    const entity = await this.pointsTransactionRepository.findOne({
      where: { idempotencyKey },
    });

    if (!entity) {
      return null;
    }

    return PointsTransactionMapper.toDomain(entity);
  }

  async findByMembershipId(membershipId: number): Promise<PointsTransaction[]> {
    const entities = await this.pointsTransactionRepository.find({
      where: { membershipId },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => PointsTransactionMapper.toDomain(entity));
  }

  async findByMembershipIdAndType(
    membershipId: number,
    type: PointsTransaction['type'],
  ): Promise<PointsTransaction[]> {
    const entities = await this.pointsTransactionRepository.find({
      where: { membershipId, type },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => PointsTransactionMapper.toDomain(entity));
  }

  async findBySourceEventId(sourceEventId: string): Promise<PointsTransaction[]> {
    const entities = await this.pointsTransactionRepository.find({
      where: { sourceEventId },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => PointsTransactionMapper.toDomain(entity));
  }

  async findByCorrelationId(correlationId: string): Promise<PointsTransaction[]> {
    const entities = await this.pointsTransactionRepository.find({
      where: { correlationId },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => PointsTransactionMapper.toDomain(entity));
  }

  async calculateBalance(membershipId: number): Promise<number> {
    const result = await this.pointsTransactionRepository
      .createQueryBuilder('pt')
      .select('SUM(pt.pointsDelta)', 'balance')
      .where('pt.membershipId = :membershipId', { membershipId })
      .getRawOne();

    return Number(result?.balance || 0);
  }

  async calculateBalanceByProgram(membershipId: number, programId: number): Promise<number> {
    const result = await this.pointsTransactionRepository
      .createQueryBuilder('pt')
      .select('SUM(pt.pointsDelta)', 'balance')
      .where('pt.membershipId = :membershipId', { membershipId })
      .andWhere('pt.programId = :programId', { programId })
      .getRawOne();

    return Number(result?.balance || 0);
  }

  async findForTierEvaluation(
    membershipId: number,
    fromDate: Date,
    toDate: Date,
  ): Promise<PointsTransaction[]> {
    const entities = await this.pointsTransactionRepository.find({
      where: {
        membershipId,
        createdAt: Between(fromDate, toDate),
      },
      order: { createdAt: 'ASC' },
    });

    return entities.map((entity) => PointsTransactionMapper.toDomain(entity));
  }

  async findExpiringTransactions(
    membershipId: number,
    beforeDate: Date,
  ): Promise<PointsTransaction[]> {
    const entities = await this.pointsTransactionRepository.find({
      where: {
        membershipId,
        expiresAt: LessThanOrEqual(beforeDate),
        type: 'EARNING',
      },
      order: { expiresAt: 'ASC' },
    });

    return entities.map((entity) => PointsTransactionMapper.toDomain(entity));
  }

  async findReversedTransaction(reversalTransactionId: number): Promise<PointsTransaction | null> {
    const reversalEntity = await this.pointsTransactionRepository.findOne({
      where: { id: reversalTransactionId },
    });

    if (!reversalEntity || !reversalEntity.reversalOfTransactionId) {
      return null;
    }

    const originalEntity = await this.pointsTransactionRepository.findOne({
      where: { id: reversalEntity.reversalOfTransactionId },
    });

    if (!originalEntity) {
      return null;
    }

    return PointsTransactionMapper.toDomain(originalEntity);
  }

  async findReversalsOf(transactionId: number): Promise<PointsTransaction[]> {
    const entities = await this.pointsTransactionRepository.find({
      where: { reversalOfTransactionId: transactionId },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => PointsTransactionMapper.toDomain(entity));
  }

  async findEarningsByMembershipAndPeriod(
    membershipId: number,
    programId: number | null,
    ruleId: number | null,
    startDate: Date,
    endDate: Date,
  ): Promise<PointsTransaction[]> {
    const queryBuilder = this.pointsTransactionRepository
      .createQueryBuilder('pt')
      .where('pt.membershipId = :membershipId', { membershipId })
      .andWhere('pt.type = :type', { type: 'EARNING' })
      .andWhere('pt.createdAt >= :startDate', { startDate })
      .andWhere('pt.createdAt <= :endDate', { endDate });

    if (programId !== null) {
      queryBuilder.andWhere('pt.programId = :programId', { programId });
    }

    if (ruleId !== null) {
      queryBuilder.andWhere('pt.rewardRuleId = :ruleId', { ruleId });
    }

    queryBuilder.orderBy('pt.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();

    return entities.map((entity) => PointsTransactionMapper.toDomain(entity));
  }
}
