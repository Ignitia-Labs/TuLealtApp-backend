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

  /**
   * Busca múltiples transacciones por idempotency keys (batch query)
   * Optimización para evitar N+1 queries en ProcessLoyaltyEventHandler
   */
  async findByIdempotencyKeys(
    idempotencyKeys: string[],
  ): Promise<Map<string, PointsTransaction>> {
    if (idempotencyKeys.length === 0) {
      return new Map();
    }

    const entities = await this.pointsTransactionRepository
      .createQueryBuilder('pt')
      .where('pt.idempotencyKey IN (:...idempotencyKeys)', { idempotencyKeys })
      .getMany();

    const resultMap = new Map<string, PointsTransaction>();
    entities.forEach((entity) => {
      const domain = PointsTransactionMapper.toDomain(entity);
      resultMap.set(entity.idempotencyKey, domain);
    });

    return resultMap;
  }

  /**
   * Obtiene métricas de revenue agregadas por sucursal para un tenant
   * Usa los nuevos campos amount y currency con índices optimizados
   * Query optimizada usando índice IDX_POINTS_TRANSACTIONS_AMOUNT_BRANCH
   */
  async getBranchRevenueMetrics(
    tenantId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{
      branchId: number;
      totalRevenue: number;
      transactionCount: number;
      avgTicket: number;
      currency: string;
    }>
  > {
    let query = this.pointsTransactionRepository
      .createQueryBuilder('pt')
      .innerJoin(CustomerMembershipEntity, 'cm', 'pt.membershipId = cm.id')
      .where('cm.tenantId = :tenantId', { tenantId })
      .andWhere('pt.type = :earningType', { earningType: 'EARNING' })
      .andWhere('pt.branchId IS NOT NULL')
      .andWhere('pt.amount IS NOT NULL') // ← Solo transacciones con revenue
      .andWhere('pt.amount > 0');

    if (startDate) {
      query = query.andWhere('pt.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query = query.andWhere('pt.createdAt <= :endDate', { endDate });
    }

    const results = await query
      .select([
        'pt.branchId as branchId',
        'COALESCE(pt.currency, "GTQ") as currency',
        'COUNT(*) as transactionCount',
        'ROUND(SUM(pt.amount), 2) as totalRevenue',
        'ROUND(AVG(pt.amount), 2) as avgTicket',
      ])
      .groupBy('pt.branchId, pt.currency')
      .orderBy('totalRevenue', 'DESC')
      .getRawMany();

    return results.map((row) => ({
      branchId: Number(row.branchId),
      totalRevenue: Number(row.totalRevenue || 0),
      transactionCount: Number(row.transactionCount || 0),
      avgTicket: Number(row.avgTicket || 0),
      currency: String(row.currency || 'GTQ'),
    }));
  }

  /**
   * Obtiene el revenue total de un tenant para un período específico
   * Query optimizada usando índice IDX_POINTS_TRANSACTIONS_AMOUNT_TENANT
   */
  async getTenantRevenueMetrics(
    tenantId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalRevenue: number;
    transactionCount: number;
    avgTicket: number;
    currency: string;
  }> {
    let query = this.pointsTransactionRepository
      .createQueryBuilder('pt')
      .innerJoin(CustomerMembershipEntity, 'cm', 'pt.membershipId = cm.id')
      .where('cm.tenantId = :tenantId', { tenantId })
      .andWhere('pt.type = :earningType', { earningType: 'EARNING' })
      .andWhere('pt.amount IS NOT NULL') // ← Solo transacciones con revenue
      .andWhere('pt.amount > 0');

    if (startDate) {
      query = query.andWhere('pt.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query = query.andWhere('pt.createdAt <= :endDate', { endDate });
    }

    const result = await query
      .select([
        'COALESCE(pt.currency, "GTQ") as currency',
        'COUNT(*) as transactionCount',
        'ROUND(SUM(pt.amount), 2) as totalRevenue',
        'ROUND(AVG(pt.amount), 2) as avgTicket',
      ])
      .groupBy('pt.currency')
      .getRawOne();

    if (!result) {
      return {
        totalRevenue: 0,
        transactionCount: 0,
        avgTicket: 0,
        currency: 'GTQ',
      };
    }

    return {
      totalRevenue: Number(result.totalRevenue || 0),
      transactionCount: Number(result.transactionCount || 0),
      avgTicket: Number(result.avgTicket || 0),
      currency: String(result.currency || 'GTQ'),
    };
  }

  /**
   * Obtiene métricas de revenue para una sucursal específica
   * Query optimizada usando índice IDX_POINTS_TRANSACTIONS_AMOUNT_BRANCH
   */
  async getBranchRevenue(
    branchId: number,
    tenantId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalRevenue: number;
    transactionCount: number;
    avgTicket: number;
    currency: string;
  }> {
    let query = this.pointsTransactionRepository
      .createQueryBuilder('pt')
      .innerJoin(CustomerMembershipEntity, 'cm', 'pt.membershipId = cm.id')
      .where('cm.tenantId = :tenantId', { tenantId })
      .andWhere('pt.branchId = :branchId', { branchId })
      .andWhere('pt.type = :earningType', { earningType: 'EARNING' })
      .andWhere('pt.amount IS NOT NULL') // ← Solo transacciones con revenue
      .andWhere('pt.amount > 0');

    if (startDate) {
      query = query.andWhere('pt.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query = query.andWhere('pt.createdAt <= :endDate', { endDate });
    }

    const result = await query
      .select([
        'COALESCE(pt.currency, "GTQ") as currency',
        'COUNT(*) as transactionCount',
        'ROUND(SUM(pt.amount), 2) as totalRevenue',
        'ROUND(AVG(pt.amount), 2) as avgTicket',
      ])
      .groupBy('pt.currency')
      .getRawOne();

    if (!result) {
      return {
        totalRevenue: 0,
        transactionCount: 0,
        avgTicket: 0,
        currency: 'GTQ',
      };
    }

    return {
      totalRevenue: Number(result.totalRevenue || 0),
      transactionCount: Number(result.transactionCount || 0),
      avgTicket: Number(result.avgTicket || 0),
      currency: String(result.currency || 'GTQ'),
    };
  }

  /**
   * Obtiene métricas de clientes por sucursal
   * Cuenta clientes únicos (all time) y activos (in period) por sucursal
   */
  async getBranchCustomerMetrics(
    tenantId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{
      branchId: number;
      totalCustomers: number;
      activeCustomers: number;
    }>
  > {
    // Query con conteo de clientes únicos y activos por sucursal
    let query = this.pointsTransactionRepository
      .createQueryBuilder('pt')
      .innerJoin(CustomerMembershipEntity, 'cm', 'pt.membershipId = cm.id')
      .where('cm.tenantId = :tenantId', { tenantId })
      .andWhere('pt.branchId IS NOT NULL');

    const results = await query
      .select([
        'pt.branchId as branchId',
        'COUNT(DISTINCT pt.membershipId) as totalCustomers',
        startDate && endDate
          ? `COUNT(DISTINCT CASE 
               WHEN pt.createdAt >= :startDate AND pt.createdAt <= :endDate 
               THEN pt.membershipId 
             END) as activeCustomers`
          : 'COUNT(DISTINCT pt.membershipId) as activeCustomers',
      ])
      .setParameters(
        startDate && endDate
          ? { tenantId, startDate, endDate }
          : { tenantId },
      )
      .groupBy('pt.branchId')
      .getRawMany();

    return results.map((row) => ({
      branchId: Number(row.branchId),
      totalCustomers: Number(row.totalCustomers || 0),
      activeCustomers: Number(row.activeCustomers || 0),
    }));
  }

  /**
   * Obtiene métricas de redemptions por sucursal
   * Cuenta transacciones de tipo REDEEM por sucursal en un período
   */
  async getBranchRedemptionMetrics(
    tenantId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{
      branchId: number;
      rewardsRedeemed: number;
    }>
  > {
    let query = this.pointsTransactionRepository
      .createQueryBuilder('pt')
      .innerJoin(CustomerMembershipEntity, 'cm', 'pt.membershipId = cm.id')
      .where('cm.tenantId = :tenantId', { tenantId })
      .andWhere('pt.type = :redeemType', { redeemType: 'REDEEM' })
      .andWhere('pt.branchId IS NOT NULL');

    if (startDate) {
      query = query.andWhere('pt.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query = query.andWhere('pt.createdAt <= :endDate', { endDate });
    }

    const results = await query
      .select(['pt.branchId as branchId', 'COUNT(*) as rewardsRedeemed'])
      .groupBy('pt.branchId')
      .getRawMany();

    return results.map((row) => ({
      branchId: Number(row.branchId),
      rewardsRedeemed: Number(row.rewardsRedeemed || 0),
    }));
  }

  /**
   * Calcula la tasa de retorno para un tenant en un período
   * Return rate = (memberships con >=2 transacciones / total memberships con >=1 transacción) * 100
   */
  async calculateReturnRate(tenantId: number, startDate: Date, endDate: Date): Promise<number> {
    const result = await this.pointsTransactionRepository
      .createQueryBuilder('pt')
      .innerJoin(CustomerMembershipEntity, 'cm', 'pt.membershipId = cm.id')
      .where('cm.tenantId = :tenantId', { tenantId })
      .andWhere('pt.createdAt >= :startDate', { startDate })
      .andWhere('pt.createdAt <= :endDate', { endDate })
      .select([
        'COUNT(DISTINCT pt.membershipId) as totalCustomers',
        'COUNT(DISTINCT CASE WHEN tx_count.count >= 2 THEN pt.membershipId END) as returningCustomers',
      ])
      .innerJoin(
        (qb) =>
          qb
            .select(['membershipId', 'COUNT(*) as count'])
            .from('points_transactions', 'pt2')
            .innerJoin(CustomerMembershipEntity, 'cm2', 'pt2.membershipId = cm2.id')
            .where('cm2.tenantId = :tenantId', { tenantId })
            .andWhere('pt2.createdAt >= :startDate', { startDate })
            .andWhere('pt2.createdAt <= :endDate', { endDate })
            .groupBy('membershipId'),
        'tx_count',
        'tx_count.membershipId = pt.membershipId',
      )
      .getRawOne();

    const totalCustomers = Number(result?.totalCustomers || 0);
    const returningCustomers = Number(result?.returningCustomers || 0);

    if (totalCustomers === 0) {
      return 0;
    }

    return Math.round((returningCustomers / totalCustomers) * 10000) / 100;
  }

  /**
   * Obtiene datos agregados por cliente para segmentación
   * Query optimizada con índices en tenantId, createdAt, y amount
   */
  async getCustomerDataForSegmentation(
    tenantId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<
    Array<{
      membershipId: number;
      transactionCount: number;
      totalRevenue: number;
      totalPoints: number;
    }>
  > {
    const results = await this.pointsTransactionRepository
      .createQueryBuilder('pt')
      .innerJoin(CustomerMembershipEntity, 'cm', 'pt.membershipId = cm.id')
      .where('cm.tenantId = :tenantId', { tenantId })
      .andWhere('pt.createdAt >= :startDate', { startDate })
      .andWhere('pt.createdAt <= :endDate', { endDate })
      .select([
        'pt.membershipId as membershipId',
        'COUNT(*) as transactionCount',
        'COALESCE(SUM(CASE WHEN pt.amount IS NOT NULL THEN pt.amount ELSE 0 END), 0) as totalRevenue',
        'COALESCE(SUM(CASE WHEN pt.type = "EARNING" THEN pt.pointsDelta ELSE 0 END), 0) as totalPoints',
      ])
      .groupBy('pt.membershipId')
      .getRawMany();

    return results.map((row) => ({
      membershipId: Number(row.membershipId),
      transactionCount: Number(row.transactionCount),
      totalRevenue: Number(row.totalRevenue),
      totalPoints: Number(row.totalPoints),
    }));
  }

  /**
   * Obtiene revenue generado por clientes que canjearon una recompensa específica
   * Busca todas las memberships que canjearon esa reward, y suma su revenue en el período
   */
  async getRevenueByReward(
    ruleId: number,
    tenantId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    // 1. Obtener memberships que canjearon esta reward
    const redemptionMembers = await this.pointsTransactionRepository
      .createQueryBuilder('pt')
      .innerJoin(CustomerMembershipEntity, 'cm', 'pt.membershipId = cm.id')
      .where('cm.tenantId = :tenantId', { tenantId })
      .andWhere('pt.type = :redeemType', { redeemType: 'REDEEM' })
      .andWhere('pt.rewardRuleId = :ruleId', { ruleId })
      .andWhere('pt.createdAt >= :startDate', { startDate })
      .andWhere('pt.createdAt <= :endDate', { endDate })
      .select('DISTINCT pt.membershipId as membershipId')
      .getRawMany();

    if (redemptionMembers.length === 0) {
      return 0;
    }

    const membershipIds = redemptionMembers.map((m) => Number(m.membershipId));

    // 2. Sumar revenue de esas memberships (transacciones tipo EARNING con amount)
    const result = await this.pointsTransactionRepository
      .createQueryBuilder('pt')
      .innerJoin(CustomerMembershipEntity, 'cm', 'pt.membershipId = cm.id')
      .where('cm.tenantId = :tenantId', { tenantId })
      .andWhere('pt.membershipId IN (:...membershipIds)', { membershipIds })
      .andWhere('pt.type = :earningType', { earningType: 'EARNING' })
      .andWhere('pt.amount IS NOT NULL')
      .andWhere('pt.amount > 0')
      .andWhere('pt.createdAt >= :startDate', { startDate })
      .andWhere('pt.createdAt <= :endDate', { endDate })
      .select('COALESCE(SUM(pt.amount), 0) as totalRevenue')
      .getRawOne();

    return Number(result?.totalRevenue || 0);
  }

  /**
   * Obtiene el segmento de cliente que más canjea una recompensa
   * Segmentación rápida basada en número de transacciones y revenue
   */
  async getTopSegmentByReward(
    ruleId: number,
    tenantId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<string> {
    // Obtener memberships que canjearon esta reward con sus métricas
    const results = await this.pointsTransactionRepository
      .createQueryBuilder('pt_redeem')
      .innerJoin(CustomerMembershipEntity, 'cm', 'pt_redeem.membershipId = cm.id')
      .where('cm.tenantId = :tenantId', { tenantId })
      .andWhere('pt_redeem.type = :redeemType', { redeemType: 'REDEEM' })
      .andWhere('pt_redeem.rewardRuleId = :ruleId', { ruleId })
      .andWhere('pt_redeem.createdAt >= :startDate', { startDate })
      .andWhere('pt_redeem.createdAt <= :endDate', { endDate })
      .innerJoin(
        (qb) =>
          qb
            .select([
              'pt.membershipId as membershipId',
              'COUNT(*) as transactionCount',
              'COALESCE(SUM(CASE WHEN pt.amount IS NOT NULL THEN pt.amount ELSE 0 END), 0) as totalRevenue',
            ])
            .from('points_transactions', 'pt')
            .innerJoin(CustomerMembershipEntity, 'cm2', 'pt.membershipId = cm2.id')
            .where('cm2.tenantId = :tenantId', { tenantId })
            .andWhere('pt.createdAt >= :startDate', { startDate })
            .andWhere('pt.createdAt <= :endDate', { endDate })
            .groupBy('pt.membershipId'),
        'metrics',
        'metrics.membershipId = pt_redeem.membershipId',
      )
      .select([
        'CASE ' +
          'WHEN metrics.transactionCount >= 10 AND metrics.totalRevenue > 500 THEN "VIP" ' +
          'WHEN metrics.transactionCount >= 5 OR metrics.totalRevenue >= 200 THEN "FREQUENT" ' +
          'WHEN metrics.transactionCount >= 2 OR metrics.totalRevenue >= 50 THEN "OCCASIONAL" ' +
          'ELSE "AT_RISK" ' +
          'END as segment',
        'COUNT(*) as count',
      ])
      .groupBy('segment')
      .orderBy('count', 'DESC')
      .getRawOne();

    return results?.segment || 'OCCASIONAL';
  }

  /**
   * Obtiene la sucursal donde más se canjea una recompensa
   */
  async getTopBranchByReward(
    ruleId: number,
    tenantId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<{ branchId: number; branchName: string } | null> {
    const result = await this.pointsTransactionRepository
      .createQueryBuilder('pt')
      .innerJoin(CustomerMembershipEntity, 'cm', 'pt.membershipId = cm.id')
      .innerJoin('branches', 'b', 'pt.branchId = b.id')
      .where('cm.tenantId = :tenantId', { tenantId })
      .andWhere('pt.type = :redeemType', { redeemType: 'REDEEM' })
      .andWhere('pt.rewardRuleId = :ruleId', { ruleId })
      .andWhere('pt.branchId IS NOT NULL')
      .andWhere('pt.createdAt >= :startDate', { startDate })
      .andWhere('pt.createdAt <= :endDate', { endDate })
      .select(['pt.branchId as branchId', 'b.name as branchName', 'COUNT(*) as count'])
      .groupBy('pt.branchId')
      .addGroupBy('b.name')
      .orderBy('count', 'DESC')
      .limit(1)
      .getRawOne();

    if (!result) {
      return null;
    }

    return {
      branchId: Number(result.branchId),
      branchName: String(result.branchName),
    };
  }
}

