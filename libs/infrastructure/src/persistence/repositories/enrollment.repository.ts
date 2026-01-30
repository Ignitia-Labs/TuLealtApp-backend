import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IEnrollmentRepository, Enrollment } from '@libs/domain';
import { EnrollmentEntity } from '../entities/enrollment.entity';
import { EnrollmentMapper } from '../mappers/enrollment.mapper';

/**
 * Implementación del repositorio de Enrollment usando TypeORM
 */
@Injectable()
export class EnrollmentRepository implements IEnrollmentRepository {
  constructor(
    @InjectRepository(EnrollmentEntity)
    private readonly enrollmentRepository: Repository<EnrollmentEntity>,
  ) {}

  async save(enrollment: Enrollment): Promise<Enrollment> {
    const entity = EnrollmentMapper.toPersistence(enrollment);
    const savedEntity = await this.enrollmentRepository.save(entity);
    return EnrollmentMapper.toDomain(savedEntity);
  }

  async findById(id: number): Promise<Enrollment | null> {
    const entity = await this.enrollmentRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return EnrollmentMapper.toDomain(entity);
  }

  async findActiveByMembershipId(membershipId: number): Promise<Enrollment[]> {
    const now = new Date();
    const entities = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .where('enrollment.membershipId = :membershipId', { membershipId })
      .andWhere('enrollment.status = :status', { status: 'ACTIVE' })
      .andWhere('enrollment.effectiveFrom <= :now', { now })
      .andWhere('(enrollment.effectiveTo IS NULL OR enrollment.effectiveTo >= :now)', { now })
      .orderBy('enrollment.createdAt', 'ASC')
      .getMany();

    return entities.map((entity) => EnrollmentMapper.toDomain(entity));
  }

  async findByMembershipId(membershipId: number): Promise<Enrollment[]> {
    const entities = await this.enrollmentRepository.find({
      where: { membershipId },
      order: { createdAt: 'ASC' },
    });

    return entities.map((entity) => EnrollmentMapper.toDomain(entity));
  }

  async findActiveByProgramId(programId: number): Promise<Enrollment[]> {
    const now = new Date();
    const entities = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .where('enrollment.programId = :programId', { programId })
      .andWhere('enrollment.status = :status', { status: 'ACTIVE' })
      .andWhere('enrollment.effectiveFrom <= :now', { now })
      .andWhere('(enrollment.effectiveTo IS NULL OR enrollment.effectiveTo >= :now)', { now })
      .orderBy('enrollment.createdAt', 'ASC')
      .getMany();

    return entities.map((entity) => EnrollmentMapper.toDomain(entity));
  }

  async findByMembershipIdAndProgramId(
    membershipId: number,
    programId: number,
  ): Promise<Enrollment | null> {
    const entity = await this.enrollmentRepository.findOne({
      where: { membershipId, programId },
    });

    if (!entity) {
      return null;
    }

    return EnrollmentMapper.toDomain(entity);
  }

  async findActiveByMembershipIdAndProgramType(
    membershipId: number,
    programType: string,
  ): Promise<Enrollment[]> {
    const now = new Date();
    const entities = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .innerJoin('enrollment.program', 'program')
      .where('enrollment.membershipId = :membershipId', { membershipId })
      .andWhere('enrollment.status = :status', { status: 'ACTIVE' })
      .andWhere('program.programType = :programType', { programType })
      .andWhere('enrollment.effectiveFrom <= :now', { now })
      .andWhere('(enrollment.effectiveTo IS NULL OR enrollment.effectiveTo >= :now)', { now })
      .orderBy('enrollment.createdAt', 'ASC')
      .getMany();

    return entities.map((entity) => EnrollmentMapper.toDomain(entity));
  }

  async isEnrolled(membershipId: number, programId: number): Promise<boolean> {
    const enrollment = await this.findByMembershipIdAndProgramId(membershipId, programId);
    return enrollment !== null && enrollment.isActive();
  }

  async countActiveByMembershipId(membershipId: number): Promise<number> {
    const now = new Date();
    return await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .where('enrollment.membershipId = :membershipId', { membershipId })
      .andWhere('enrollment.status = :status', { status: 'ACTIVE' })
      .andWhere('enrollment.effectiveFrom <= :now', { now })
      .andWhere('(enrollment.effectiveTo IS NULL OR enrollment.effectiveTo >= :now)', { now })
      .getCount();
  }

  async delete(id: number): Promise<void> {
    await this.enrollmentRepository.delete(id);
  }
}
