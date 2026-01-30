import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ITierStatusRepository, TierStatus } from '@libs/domain';
import { TierStatusEntity } from '../entities/tier-status.entity';
import { TierStatusMapper } from '../mappers/tier-status.mapper';

/**
 * Implementación del repositorio de TierStatus usando TypeORM
 */
@Injectable()
export class TierStatusRepository implements ITierStatusRepository {
  constructor(
    @InjectRepository(TierStatusEntity)
    private readonly tierStatusRepository: Repository<TierStatusEntity>,
  ) {}

  async findByMembershipId(membershipId: number): Promise<TierStatus | null> {
    const entity = await this.tierStatusRepository.findOne({
      where: { membershipId },
    });

    if (!entity) {
      return null;
    }

    return TierStatusMapper.toDomain(entity);
  }

  async findPendingEvaluation(now: Date): Promise<TierStatus[]> {
    const entities = await this.tierStatusRepository
      .createQueryBuilder('status')
      .where('status.nextEvalAt IS NOT NULL')
      .andWhere('status.nextEvalAt <= :now', { now })
      .getMany();

    return entities.map((entity) => TierStatusMapper.toDomain(entity));
  }

  async findExpiringGracePeriods(now: Date): Promise<TierStatus[]> {
    const entities = await this.tierStatusRepository
      .createQueryBuilder('status')
      .where('status.graceUntil IS NOT NULL')
      .andWhere('status.graceUntil <= :now', { now })
      .getMany();

    return entities.map((entity) => TierStatusMapper.toDomain(entity));
  }

  async save(status: TierStatus): Promise<TierStatus> {
    const entity = TierStatusMapper.toPersistence(status);
    const savedEntity = await this.tierStatusRepository.save(entity);
    return TierStatusMapper.toDomain(savedEntity);
  }

  async delete(membershipId: number): Promise<void> {
    await this.tierStatusRepository.delete(membershipId);
  }
}
