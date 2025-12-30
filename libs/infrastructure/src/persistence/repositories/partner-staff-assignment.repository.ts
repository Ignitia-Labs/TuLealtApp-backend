import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import {
  IPartnerStaffAssignmentRepository,
  PartnerStaffAssignment,
} from '@libs/domain';
import { PartnerStaffAssignmentEntity } from '../entities/partner-staff-assignment.entity';
import { PartnerStaffAssignmentMapper } from '../mappers/partner-staff-assignment.mapper';

/**
 * Implementación del repositorio de asignaciones staff-partner usando TypeORM
 */
@Injectable()
export class PartnerStaffAssignmentRepository
  implements IPartnerStaffAssignmentRepository
{
  constructor(
    @InjectRepository(PartnerStaffAssignmentEntity)
    private readonly assignmentRepository: Repository<PartnerStaffAssignmentEntity>,
  ) {}

  async findById(id: number): Promise<PartnerStaffAssignment | null> {
    const entity = await this.assignmentRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return PartnerStaffAssignmentMapper.toDomain(entity);
  }

  async findByPartnerId(
    partnerId: number,
    activeOnly?: boolean,
  ): Promise<PartnerStaffAssignment[]> {
    const where: any = { partnerId };
    if (activeOnly) {
      where.isActive = true;
    }

    const entities = await this.assignmentRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) =>
      PartnerStaffAssignmentMapper.toDomain(entity),
    );
  }

  async findByStaffUserId(
    staffUserId: number,
    activeOnly?: boolean,
  ): Promise<PartnerStaffAssignment[]> {
    const where: any = { staffUserId };
    if (activeOnly) {
      where.isActive = true;
    }

    const entities = await this.assignmentRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) =>
      PartnerStaffAssignmentMapper.toDomain(entity),
    );
  }

  async findByPartnerAndStaff(
    partnerId: number,
    staffUserId: number,
  ): Promise<PartnerStaffAssignment | null> {
    const entity = await this.assignmentRepository.findOne({
      where: { partnerId, staffUserId },
    });

    if (!entity) {
      return null;
    }

    return PartnerStaffAssignmentMapper.toDomain(entity);
  }

  async findAll(activeOnly?: boolean): Promise<PartnerStaffAssignment[]> {
    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }

    const entities = await this.assignmentRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) =>
      PartnerStaffAssignmentMapper.toDomain(entity),
    );
  }

  async save(
    assignment: PartnerStaffAssignment,
  ): Promise<PartnerStaffAssignment> {
    const entity = PartnerStaffAssignmentMapper.toPersistence(assignment);
    const savedEntity = await this.assignmentRepository.save(entity);
    return PartnerStaffAssignmentMapper.toDomain(savedEntity);
  }

  async update(
    assignment: PartnerStaffAssignment,
  ): Promise<PartnerStaffAssignment> {
    const entity = PartnerStaffAssignmentMapper.toPersistence(assignment);
    const updatedEntity = await this.assignmentRepository.save(entity);
    return PartnerStaffAssignmentMapper.toDomain(updatedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.assignmentRepository.delete(id);
  }

  async getTotalCommissionPercent(
    partnerId: number,
    excludeId?: number,
  ): Promise<number> {
    const queryBuilder = this.assignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.partnerId = :partnerId', { partnerId })
      .andWhere('assignment.isActive = :isActive', { isActive: true });

    if (excludeId) {
      queryBuilder.andWhere('assignment.id != :excludeId', { excludeId });
    }

    const result = await queryBuilder
      .select('SUM(assignment.commissionPercent)', 'total')
      .getRawOne();

    return result?.total ? Number(result.total) : 0;
  }

  async findActiveAssignmentsByDate(
    partnerId: number,
    date: Date,
  ): Promise<PartnerStaffAssignment[]> {
    // Buscar asignaciones que:
    // 1. Estén activas (isActive = true)
    // 2. El partnerId coincida
    // 3. La fecha esté entre startDate y endDate (si endDate no es null)
    // 4. O si endDate es null, la fecha sea >= startDate

    const entities = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.partnerId = :partnerId', { partnerId })
      .andWhere('assignment.isActive = :isActive', { isActive: true })
      .andWhere('assignment.startDate <= :date', { date })
      .andWhere(
        '(assignment.endDate IS NULL OR assignment.endDate >= :date)',
        { date },
      )
      .orderBy('assignment.createdAt', 'DESC')
      .getMany();

    return entities.map((entity) =>
      PartnerStaffAssignmentMapper.toDomain(entity),
    );
  }
}

