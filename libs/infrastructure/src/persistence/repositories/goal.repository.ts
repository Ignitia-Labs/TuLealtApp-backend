import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IGoalRepository, Goal } from '@libs/domain';
import { GoalEntity } from '../entities/goal.entity';
import { GoalMapper } from '../mappers/goal.mapper';

/**
 * Implementación del repositorio de Goal usando TypeORM
 */
@Injectable()
export class GoalRepository implements IGoalRepository {
  constructor(
    @InjectRepository(GoalEntity)
    private readonly goalRepository: Repository<GoalEntity>,
  ) {}

  async findById(id: number): Promise<Goal | null> {
    const entity = await this.goalRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return GoalMapper.toDomain(entity);
  }

  async findAll(activeOnly: boolean = false): Promise<Goal[]> {
    const where = activeOnly ? { isActive: true } : {};
    const entities = await this.goalRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => GoalMapper.toDomain(entity));
  }

  async save(goal: Goal): Promise<Goal> {
    const entity = GoalMapper.toPersistence(goal);
    const savedEntity = await this.goalRepository.save(entity);
    return GoalMapper.toDomain(savedEntity);
  }

  async update(goal: Goal): Promise<Goal> {
    const entity = GoalMapper.toPersistence(goal);
    const updatedEntity = await this.goalRepository.save(entity);
    return GoalMapper.toDomain(updatedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.goalRepository.delete(id);
  }
}

