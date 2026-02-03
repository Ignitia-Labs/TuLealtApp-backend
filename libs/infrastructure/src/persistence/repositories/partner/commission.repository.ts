import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  ICommissionRepository,
  Commission,
  CommissionStatus,
  CommissionFilters,
} from '@libs/domain';
import { CommissionEntity } from '@libs/infrastructure/entities/partner/commission.entity';
import { CommissionMapper } from '@libs/infrastructure/mappers/partner/commission.mapper';

/**
 * Implementación del repositorio de comisiones usando TypeORM
 */
@Injectable()
export class CommissionRepository implements ICommissionRepository {
  constructor(
    @InjectRepository(CommissionEntity)
    private readonly commissionRepository: Repository<CommissionEntity>,
  ) {}

  async findById(id: number): Promise<Commission | null> {
    const entity = await this.commissionRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return CommissionMapper.toDomain(entity);
  }

  async findByPaymentId(paymentId: number): Promise<Commission[]> {
    const entities = await this.commissionRepository.find({
      where: { paymentId },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => CommissionMapper.toDomain(entity));
  }

  async findByBillingCycleId(billingCycleId: number): Promise<Commission[]> {
    const entities = await this.commissionRepository.find({
      where: { billingCycleId },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => CommissionMapper.toDomain(entity));
  }

  async findByStaffUserId(staffUserId: number, filters?: CommissionFilters): Promise<Commission[]> {
    const queryBuilder = this.commissionRepository
      .createQueryBuilder('commission')
      .where('commission.staffUserId = :staffUserId', { staffUserId });

    if (filters?.status) {
      queryBuilder.andWhere('commission.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('commission.paymentDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('commission.paymentDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters?.skip !== undefined) {
      queryBuilder.skip(filters.skip);
    }

    if (filters?.take !== undefined) {
      queryBuilder.take(filters.take);
    }

    queryBuilder.orderBy('commission.paymentDate', 'DESC');

    const entities = await queryBuilder.getMany();

    return entities.map((entity) => CommissionMapper.toDomain(entity));
  }

  async findByPartnerId(partnerId: number, filters?: CommissionFilters): Promise<Commission[]> {
    const queryBuilder = this.commissionRepository
      .createQueryBuilder('commission')
      .where('commission.partnerId = :partnerId', { partnerId });

    if (filters?.status) {
      queryBuilder.andWhere('commission.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('commission.paymentDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('commission.paymentDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters?.skip !== undefined) {
      queryBuilder.skip(filters.skip);
    }

    if (filters?.take !== undefined) {
      queryBuilder.take(filters.take);
    }

    queryBuilder.orderBy('commission.paymentDate', 'DESC');

    const entities = await queryBuilder.getMany();

    return entities.map((entity) => CommissionMapper.toDomain(entity));
  }

  async save(commission: Commission): Promise<Commission> {
    const entity = CommissionMapper.toPersistence(commission);
    const savedEntity = await this.commissionRepository.save(entity);
    return CommissionMapper.toDomain(savedEntity);
  }

  async saveMany(commissions: Commission[]): Promise<Commission[]> {
    const entities = commissions.map((c) => CommissionMapper.toPersistence(c));
    const savedEntities = await this.commissionRepository.save(entities);
    return savedEntities.map((entity) => CommissionMapper.toDomain(entity));
  }

  async update(commission: Commission): Promise<Commission> {
    const entity = CommissionMapper.toPersistence(commission);
    const updatedEntity = await this.commissionRepository.save(entity);
    return CommissionMapper.toDomain(updatedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.commissionRepository.delete(id);
  }

  async getTotalCommissionsByStaff(
    staffUserId: number,
    startDate?: Date,
    endDate?: Date,
    status?: CommissionStatus,
  ): Promise<number> {
    const queryBuilder = this.commissionRepository
      .createQueryBuilder('commission')
      .where('commission.staffUserId = :staffUserId', { staffUserId })
      .select('SUM(commission.commissionAmount)', 'total');

    if (startDate) {
      queryBuilder.andWhere('commission.paymentDate >= :startDate', {
        startDate,
      });
    }

    if (endDate) {
      queryBuilder.andWhere('commission.paymentDate <= :endDate', { endDate });
    }

    if (status) {
      queryBuilder.andWhere('commission.status = :status', { status });
    }

    const result = await queryBuilder.getRawOne();

    return result?.total ? Number(result.total) : 0;
  }

  async getTotalCommissionsByPartner(
    partnerId: number,
    startDate?: Date,
    endDate?: Date,
    status?: CommissionStatus,
  ): Promise<number> {
    const queryBuilder = this.commissionRepository
      .createQueryBuilder('commission')
      .where('commission.partnerId = :partnerId', { partnerId })
      .select('SUM(commission.commissionAmount)', 'total');

    if (startDate) {
      queryBuilder.andWhere('commission.paymentDate >= :startDate', {
        startDate,
      });
    }

    if (endDate) {
      queryBuilder.andWhere('commission.paymentDate <= :endDate', { endDate });
    }

    if (status) {
      queryBuilder.andWhere('commission.status = :status', { status });
    }

    const result = await queryBuilder.getRawOne();

    return result?.total ? Number(result.total) : 0;
  }

  async countByStaffUserId(staffUserId: number, filters?: CommissionFilters): Promise<number> {
    const queryBuilder = this.commissionRepository
      .createQueryBuilder('commission')
      .where('commission.staffUserId = :staffUserId', { staffUserId });

    if (filters?.status) {
      queryBuilder.andWhere('commission.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('commission.paymentDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('commission.paymentDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    return queryBuilder.getCount();
  }

  async countByPartnerId(partnerId: number, filters?: CommissionFilters): Promise<number> {
    const queryBuilder = this.commissionRepository
      .createQueryBuilder('commission')
      .where('commission.partnerId = :partnerId', { partnerId });

    if (filters?.status) {
      queryBuilder.andWhere('commission.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('commission.paymentDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('commission.paymentDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    return queryBuilder.getCount();
  }

  async findAll(filters?: CommissionFilters): Promise<Commission[]> {
    const queryBuilder = this.commissionRepository.createQueryBuilder('commission');

    if (filters?.status) {
      queryBuilder.andWhere('commission.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('commission.paymentDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('commission.paymentDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters?.skip !== undefined) {
      queryBuilder.skip(filters.skip);
    }

    if (filters?.take !== undefined) {
      queryBuilder.take(filters.take);
    }

    queryBuilder.orderBy('commission.paymentDate', 'DESC');

    const entities = await queryBuilder.getMany();

    return entities.map((entity) => CommissionMapper.toDomain(entity));
  }

  async count(filters?: CommissionFilters): Promise<number> {
    const queryBuilder = this.commissionRepository.createQueryBuilder('commission');

    if (filters?.status) {
      queryBuilder.andWhere('commission.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('commission.paymentDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('commission.paymentDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    return queryBuilder.getCount();
  }

  async getStatsByStaff(
    startDate?: Date,
    endDate?: Date,
    limit?: number,
  ): Promise<
    Array<{
      staffUserId: number;
      totalCommissions: number;
      totalAmount: number;
      pendingAmount: number;
      paidAmount: number;
      currency: string;
    }>
  > {
    const queryBuilder = this.commissionRepository
      .createQueryBuilder('commission')
      .select('commission.staffUserId', 'staffUserId')
      .addSelect('COUNT(commission.id)', 'totalCommissions')
      .addSelect('SUM(commission.commissionAmount)', 'totalAmount')
      .addSelect(
        "SUM(CASE WHEN commission.status = 'pending' THEN commission.commissionAmount ELSE 0 END)",
        'pendingAmount',
      )
      .addSelect(
        "SUM(CASE WHEN commission.status = 'paid' THEN commission.commissionAmount ELSE 0 END)",
        'paidAmount',
      )
      .addSelect('MAX(commission.currency)', 'currency')
      .groupBy('commission.staffUserId')
      .orderBy('totalAmount', 'DESC');

    if (startDate) {
      queryBuilder.andWhere('commission.paymentDate >= :startDate', {
        startDate,
      });
    }

    if (endDate) {
      queryBuilder.andWhere('commission.paymentDate <= :endDate', { endDate });
    }

    if (limit) {
      queryBuilder.limit(limit);
    }

    const results = await queryBuilder.getRawMany();

    return results.map((r) => ({
      staffUserId: Number(r.staffUserId),
      totalCommissions: Number(r.totalCommissions),
      totalAmount: Number(r.totalAmount) || 0,
      pendingAmount: Number(r.pendingAmount) || 0,
      paidAmount: Number(r.paidAmount) || 0,
      currency: r.currency || 'USD',
    }));
  }

  async getStatsByPartner(
    startDate?: Date,
    endDate?: Date,
    limit?: number,
  ): Promise<
    Array<{
      partnerId: number;
      totalCommissions: number;
      totalAmount: number;
      currency: string;
    }>
  > {
    const queryBuilder = this.commissionRepository
      .createQueryBuilder('commission')
      .select('commission.partnerId', 'partnerId')
      .addSelect('COUNT(commission.id)', 'totalCommissions')
      .addSelect('SUM(commission.commissionAmount)', 'totalAmount')
      .addSelect('MAX(commission.currency)', 'currency')
      .groupBy('commission.partnerId')
      .orderBy('totalAmount', 'DESC');

    if (startDate) {
      queryBuilder.andWhere('commission.paymentDate >= :startDate', {
        startDate,
      });
    }

    if (endDate) {
      queryBuilder.andWhere('commission.paymentDate <= :endDate', { endDate });
    }

    if (limit) {
      queryBuilder.limit(limit);
    }

    const results = await queryBuilder.getRawMany();

    return results.map((r) => ({
      partnerId: Number(r.partnerId),
      totalCommissions: Number(r.totalCommissions),
      totalAmount: Number(r.totalAmount) || 0,
      currency: r.currency || 'USD',
    }));
  }

  async getStatsByPeriod(
    startDate: Date,
    endDate: Date,
    groupBy: 'daily' | 'weekly' | 'monthly',
  ): Promise<
    Array<{
      period: string;
      totalCommissions: number;
      totalAmount: number;
      pendingCommissions: number;
      paidCommissions: number;
      currency: string;
    }>
  > {
    let dateFormat: string;
    switch (groupBy) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        dateFormat = '%Y-%u'; // Año-Semana
        break;
      case 'monthly':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const queryBuilder = this.commissionRepository
      .createQueryBuilder('commission')
      .select(`DATE_FORMAT(commission.paymentDate, '${dateFormat}')`, 'period')
      .addSelect('COUNT(commission.id)', 'totalCommissions')
      .addSelect('SUM(commission.commissionAmount)', 'totalAmount')
      .addSelect(
        "SUM(CASE WHEN commission.status = 'pending' THEN 1 ELSE 0 END)",
        'pendingCommissions',
      )
      .addSelect("SUM(CASE WHEN commission.status = 'paid' THEN 1 ELSE 0 END)", 'paidCommissions')
      .addSelect('MAX(commission.currency)', 'currency')
      .where('commission.paymentDate >= :startDate', { startDate })
      .andWhere('commission.paymentDate <= :endDate', { endDate })
      .groupBy('period')
      .orderBy('period', 'ASC');

    const results = await queryBuilder.getRawMany();

    return results.map((r) => ({
      period: String(r.period || ''),
      totalCommissions: Number(r.totalCommissions) || 0,
      totalAmount: Number(r.totalAmount) || 0,
      pendingCommissions: Number(r.pendingCommissions) || 0,
      paidCommissions: Number(r.paidCommissions) || 0,
      currency: String(r.currency || 'USD'),
    }));
  }
}
