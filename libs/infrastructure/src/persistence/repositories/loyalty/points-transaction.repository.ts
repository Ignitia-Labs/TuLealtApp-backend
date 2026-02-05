import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { IPointsTransactionRepository, PointsTransaction } from '@libs/domain';
import { PointsTransactionEntity } from '@libs/infrastructure/entities/loyalty/points-transaction.entity';
import { PointsTransactionMapper } from '@libs/infrastructure/mappers/loyalty/points-transaction.mapper';
import { CustomerMembershipEntity } from '@libs/infrastructure/entities/customer/customer-membership.entity';

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

  async findByMembershipIdAndTypeAndRewardId(
    membershipId: number,
    type: PointsTransaction['type'],
    rewardId: number,
  ): Promise<PointsTransaction[]> {
    const entities = await this.pointsTransactionRepository.find({
      where: { membershipId, type, rewardId },
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

  async getTenantMetrics(tenantId: number): Promise<{
    totalRedemptions: number;
    pointsEarned: number;
    pointsRedeemed: number;
    topRewards: Array<{ ruleId: number; pointsAwarded: number; transactionsCount: number }>;
  }> {
    // Query optimizada con JOIN para obtener métricas agregadas del tenant
    const metricsQuery = this.pointsTransactionRepository
      .createQueryBuilder('pt')
      .innerJoin(CustomerMembershipEntity, 'cm', 'pt.membershipId = cm.id')
      .where('cm.tenantId = :tenantId', { tenantId })
      .select([
        'COUNT(CASE WHEN pt.type = :redeemType THEN 1 END) as totalRedemptions',
        'SUM(CASE WHEN pt.type = :earningType AND pt.pointsDelta > 0 THEN pt.pointsDelta ELSE 0 END) as pointsEarned',
        'SUM(CASE WHEN pt.type IN (:redeemTypes) AND pt.pointsDelta < 0 THEN ABS(pt.pointsDelta) ELSE 0 END) as pointsRedeemed',
      ])
      .setParameters({
        tenantId,
        redeemType: 'REDEEM',
        earningType: 'EARNING',
        redeemTypes: ['REDEEM', 'EXPIRATION'],
      });

    const metricsResult = await metricsQuery.getRawOne();

    // Query optimizada para top rewards con GROUP BY
    const topRewardsQuery = this.pointsTransactionRepository
      .createQueryBuilder('pt')
      .innerJoin(CustomerMembershipEntity, 'cm', 'pt.membershipId = cm.id')
      .where('cm.tenantId = :tenantId', { tenantId })
      .andWhere('pt.type = :earningType', { earningType: 'EARNING' })
      .andWhere('pt.rewardRuleId IS NOT NULL')
      .select([
        'pt.rewardRuleId as ruleId',
        'SUM(pt.pointsDelta) as pointsAwarded',
        'COUNT(pt.id) as transactionsCount',
      ])
      .groupBy('pt.rewardRuleId')
      .orderBy('pointsAwarded', 'DESC')
      .limit(10)
      .setParameter('tenantId', tenantId);

    const topRewardsResults = await topRewardsQuery.getRawMany();

    return {
      totalRedemptions: Number(metricsResult?.totalRedemptions || 0),
      pointsEarned: Number(metricsResult?.pointsEarned || 0),
      pointsRedeemed: Number(metricsResult?.pointsRedeemed || 0),
      topRewards: topRewardsResults.map((row) => ({
        ruleId: Number(row.ruleId),
        pointsAwarded: Number(row.pointsAwarded || 0),
        transactionsCount: Number(row.transactionsCount || 0),
      })),
    };
  }

  async getRecentTransactionsByTenant(tenantId: number, limit: number): Promise<PointsTransaction[]> {
    // Query optimizada con JOIN directo para obtener transacciones recientes
    const entities = await this.pointsTransactionRepository
      .createQueryBuilder('pt')
      .innerJoin(CustomerMembershipEntity, 'cm', 'pt.membershipId = cm.id')
      .where('cm.tenantId = :tenantId', { tenantId })
      .orderBy('pt.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    return entities.map((entity) => PointsTransactionMapper.toDomain(entity));
  }

  async findByTenantIdPaginated(
    tenantId: number,
    filters?: {
      type?: PointsTransaction['type'] | 'all';
      fromDate?: Date;
      toDate?: Date;
      page?: number;
      limit?: number;
    },
  ): Promise<{ transactions: PointsTransaction[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    // Query builder base con JOIN optimizado
    const queryBuilder = this.pointsTransactionRepository
      .createQueryBuilder('pt')
      .innerJoin(CustomerMembershipEntity, 'cm', 'pt.membershipId = cm.id')
      .where('cm.tenantId = :tenantId', { tenantId });

    // Aplicar filtros
    if (filters?.type && filters.type !== 'all') {
      queryBuilder.andWhere('pt.type = :type', { type: filters.type });
    }

    if (filters?.fromDate) {
      queryBuilder.andWhere('pt.createdAt >= :fromDate', { fromDate: filters.fromDate });
    }

    if (filters?.toDate) {
      queryBuilder.andWhere('pt.createdAt <= :toDate', { toDate: filters.toDate });
    }

    // Obtener total antes de paginación
    const total = await queryBuilder.getCount();

    // Aplicar paginación y ordenamiento
    queryBuilder.orderBy('pt.createdAt', 'DESC').skip(skip).take(limit);

    const entities = await queryBuilder.getMany();

    return {
      transactions: entities.map((entity) => PointsTransactionMapper.toDomain(entity)),
      total,
    };
  }

  async getDailyActivityByTenant(
    tenantId: number,
    days: number = 7,
  ): Promise<Array<{ date: string; pointsEarned: number; pointsRedeemed: number }>> {
    // Calcular fecha de inicio (hace N días)
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // Fin del día actual
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0); // Inicio del día

    // Query optimizada con JOIN y agregación por fecha usando DATE_FORMAT para MySQL/MariaDB
    const results = await this.pointsTransactionRepository
      .createQueryBuilder('pt')
      .innerJoin(CustomerMembershipEntity, 'cm', 'pt.membershipId = cm.id')
      .where('cm.tenantId = :tenantId', { tenantId })
      .andWhere('pt.createdAt >= :startDate', { startDate })
      .andWhere('pt.createdAt <= :endDate', { endDate })
      .select([
        "DATE_FORMAT(pt.createdAt, '%Y-%m-%d') as date",
        'SUM(CASE WHEN pt.type = :earningType AND pt.pointsDelta > 0 THEN pt.pointsDelta ELSE 0 END) as pointsEarned',
        'SUM(CASE WHEN pt.type = :redeemType AND pt.pointsDelta < 0 THEN ABS(pt.pointsDelta) ELSE 0 END) as pointsRedeemed',
      ])
      .groupBy("DATE_FORMAT(pt.createdAt, '%Y-%m-%d')")
      .orderBy("DATE_FORMAT(pt.createdAt, '%Y-%m-%d')", 'ASC')
      .setParameters({
        tenantId,
        startDate,
        endDate,
        earningType: 'EARNING',
        redeemType: 'REDEEM',
      })
      .getRawMany();

    return results.map((row) => ({
      date: String(row.date || ''),
      pointsEarned: Number(row.pointsEarned || 0),
      pointsRedeemed: Number(row.pointsRedeemed || 0),
    }));
  }

  async getTenantMetricsByPeriod(
    tenantId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    pointsEarnedInPeriod: number;
    pointsRedeemedInPeriod: number;
    redemptionsInPeriod: number;
  }> {
    // Query optimizada con agregaciones SQL para métricas por período
    const result = await this.pointsTransactionRepository
      .createQueryBuilder('pt')
      .innerJoin(CustomerMembershipEntity, 'cm', 'pt.membershipId = cm.id')
      .where('cm.tenantId = :tenantId', { tenantId })
      .andWhere('pt.createdAt >= :startDate', { startDate })
      .andWhere('pt.createdAt <= :endDate', { endDate })
      .select([
        'COUNT(CASE WHEN pt.type = :redeemType THEN 1 END) as redemptionsInPeriod',
        'SUM(CASE WHEN pt.type = :earningType AND pt.pointsDelta > 0 THEN pt.pointsDelta ELSE 0 END) as pointsEarnedInPeriod',
        'SUM(CASE WHEN pt.type = :redeemType AND pt.pointsDelta < 0 THEN ABS(pt.pointsDelta) ELSE 0 END) as pointsRedeemedInPeriod',
      ])
      .setParameters({
        tenantId,
        startDate,
        endDate,
        redeemType: 'REDEEM',
        earningType: 'EARNING',
      })
      .getRawOne();

    return {
      redemptionsInPeriod: Number(result?.redemptionsInPeriod || 0),
      pointsEarnedInPeriod: Number(result?.pointsEarnedInPeriod || 0),
      pointsRedeemedInPeriod: Number(result?.pointsRedeemedInPeriod || 0),
    };
  }
}
