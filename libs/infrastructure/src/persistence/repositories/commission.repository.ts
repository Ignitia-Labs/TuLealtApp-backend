import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  ICommissionRepository,
  Commission,
  CommissionStatus,
  CommissionFilters,
} from '@libs/domain';
import { CommissionEntity } from '../entities/commission.entity';
import { CommissionMapper } from '../mappers/commission.mapper';

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

  async findByStaffUserId(
    staffUserId: number,
    filters?: CommissionFilters,
  ): Promise<Commission[]> {
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

  async findByPartnerId(
    partnerId: number,
    filters?: CommissionFilters,
  ): Promise<Commission[]> {
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

  async countByStaffUserId(
    staffUserId: number,
    filters?: CommissionFilters,
  ): Promise<number> {
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

  async countByPartnerId(
    partnerId: number,
    filters?: CommissionFilters,
  ): Promise<number> {
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
}

