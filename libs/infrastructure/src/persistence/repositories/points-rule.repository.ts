import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPointsRuleRepository, PointsRule } from '@libs/domain';
import { PointsRuleEntity } from '../entities/points-rule.entity';
import { PointsRuleMapper } from '../mappers/points-rule.mapper';

/**
 * Implementación del repositorio de PointsRule usando TypeORM
 */
@Injectable()
export class PointsRuleRepository implements IPointsRuleRepository {
  constructor(
    @InjectRepository(PointsRuleEntity)
    private readonly pointsRuleRepository: Repository<PointsRuleEntity>,
  ) {}

  async findById(id: number): Promise<PointsRule | null> {
    const entity = await this.pointsRuleRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return PointsRuleMapper.toDomain(entity);
  }

  async findByTenantId(tenantId: number): Promise<PointsRule[]> {
    const entities = await this.pointsRuleRepository.find({
      where: { tenantId },
      order: { priority: 'ASC', createdAt: 'DESC' },
    });

    return entities.map((entity) => PointsRuleMapper.toDomain(entity));
  }

  async findActiveByTenantId(tenantId: number): Promise<PointsRule[]> {
    const entities = await this.pointsRuleRepository.find({
      where: { tenantId, status: 'active' },
      order: { priority: 'ASC', createdAt: 'DESC' },
    });

    return entities.map((entity) => PointsRuleMapper.toDomain(entity));
  }

  async findByType(
    tenantId: number,
    type: 'purchase' | 'birthday' | 'referral' | 'visit' | 'custom',
  ): Promise<PointsRule[]> {
    const entities = await this.pointsRuleRepository.find({
      where: { tenantId, type },
      order: { priority: 'ASC', createdAt: 'DESC' },
    });

    return entities.map((entity) => PointsRuleMapper.toDomain(entity));
  }

  async save(rule: PointsRule): Promise<PointsRule> {
    const entity = PointsRuleMapper.toPersistence(rule);
    const savedEntity = await this.pointsRuleRepository.save(entity);
    return PointsRuleMapper.toDomain(savedEntity);
  }

  async update(rule: PointsRule): Promise<PointsRule> {
    const entity = PointsRuleMapper.toPersistence(rule);
    const updatedEntity = await this.pointsRuleRepository.save(entity);
    return PointsRuleMapper.toDomain(updatedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.pointsRuleRepository.delete(id);
  }
}
