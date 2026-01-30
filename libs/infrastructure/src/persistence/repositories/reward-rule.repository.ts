import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRewardRuleRepository, RewardRule } from '@libs/domain';
import { RewardRuleEntity } from '../entities/reward-rule.entity';
import { RewardRuleMapper } from '../mappers/reward-rule.mapper';

/**
 * Implementación del repositorio de RewardRule usando TypeORM
 *
 * NOTA: Actualizado para usar columnas relacionales en lugar de JSON_EXTRACT.
 * Las relaciones (eligibility, pointsFormula) se cargan con LEFT JOIN cuando es necesario.
 */
@Injectable()
export class RewardRuleRepository implements IRewardRuleRepository {
  constructor(
    @InjectRepository(RewardRuleEntity)
    private readonly rewardRuleRepository: Repository<RewardRuleEntity>,
  ) {}

  async save(rule: RewardRule): Promise<RewardRule> {
    const entity = RewardRuleMapper.toPersistence(rule);
    const savedEntity = await this.rewardRuleRepository.save(entity);

    // Cargar relaciones después de guardar para el mapper
    const entityWithRelations = await this.rewardRuleRepository.findOne({
      where: { id: savedEntity.id },
      relations: ['eligibilityRelation', 'pointsFormulaRelation'],
    });

    return RewardRuleMapper.toDomain(entityWithRelations || savedEntity);
  }

  async findById(id: number): Promise<RewardRule | null> {
    const entity = await this.rewardRuleRepository.findOne({
      where: { id },
      relations: ['eligibilityRelation', 'pointsFormulaRelation'],
    });

    if (!entity) {
      return null;
    }

    return RewardRuleMapper.toDomain(entity);
  }

  async findByProgramId(programId: number): Promise<RewardRule[]> {
    const entities = await this.rewardRuleRepository.find({
      where: { programId },
      relations: ['eligibilityRelation', 'pointsFormulaRelation'],
      order: { conflictPriorityRank: 'DESC', createdAt: 'ASC' },
    });

    return entities.map((entity) => RewardRuleMapper.toDomain(entity));
  }

  async findActiveByProgramId(programId: number): Promise<RewardRule[]> {
    const now = new Date();
    const entities = await this.rewardRuleRepository
      .createQueryBuilder('rule')
      .leftJoinAndSelect('rule.eligibilityRelation', 'eligibility')
      .leftJoinAndSelect('eligibility.membershipStatuses', 'membershipStatuses')
      .leftJoinAndSelect('eligibility.flags', 'flags')
      .leftJoinAndSelect('eligibility.categoryIds', 'categoryIds')
      .leftJoinAndSelect('eligibility.skus', 'skus')
      .leftJoinAndSelect('rule.pointsFormulaRelation', 'pointsFormula')
      .leftJoinAndSelect('pointsFormula.tableEntries', 'tableEntries')
      .leftJoinAndSelect('pointsFormula.bonuses', 'bonuses')
      .leftJoinAndSelect('bonuses.bonusFormula', 'bonusFormula')
      .leftJoinAndSelect('bonuses.eligibility', 'bonusEligibility')
      .where('rule.programId = :programId', { programId })
      .andWhere('rule.status = :status', { status: 'active' })
      .andWhere('(rule.activeFrom IS NULL OR rule.activeFrom <= :now)', { now })
      .andWhere('(rule.activeTo IS NULL OR rule.activeTo >= :now)', { now })
      .orderBy('rule.conflictPriorityRank', 'DESC')
      .addOrderBy('rule.createdAt', 'ASC')
      .getMany();

    return entities.map((entity) => RewardRuleMapper.toDomain(entity));
  }

  async findByProgramIdAndTrigger(
    programId: number,
    trigger: RewardRule['trigger'],
  ): Promise<RewardRule[]> {
    const entities = await this.rewardRuleRepository.find({
      where: { programId, trigger },
      relations: ['eligibilityRelation', 'pointsFormulaRelation'],
      order: { conflictPriorityRank: 'DESC', createdAt: 'ASC' },
    });

    return entities.map((entity) => RewardRuleMapper.toDomain(entity));
  }

  async findActiveByProgramIdAndTrigger(
    programId: number,
    trigger: RewardRule['trigger'],
  ): Promise<RewardRule[]> {
    const now = new Date();
    const entities = await this.rewardRuleRepository
      .createQueryBuilder('rule')
      .leftJoinAndSelect('rule.eligibilityRelation', 'eligibility')
      .leftJoinAndSelect('eligibility.membershipStatuses', 'membershipStatuses')
      .leftJoinAndSelect('eligibility.flags', 'flags')
      .leftJoinAndSelect('eligibility.categoryIds', 'categoryIds')
      .leftJoinAndSelect('eligibility.skus', 'skus')
      .leftJoinAndSelect('rule.pointsFormulaRelation', 'pointsFormula')
      .leftJoinAndSelect('pointsFormula.tableEntries', 'tableEntries')
      .leftJoinAndSelect('pointsFormula.bonuses', 'bonuses')
      .leftJoinAndSelect('bonuses.bonusFormula', 'bonusFormula')
      .leftJoinAndSelect('bonuses.eligibility', 'bonusEligibility')
      .where('rule.programId = :programId', { programId })
      .andWhere('rule.trigger = :trigger', { trigger })
      .andWhere('rule.status = :status', { status: 'active' })
      .andWhere('(rule.activeFrom IS NULL OR rule.activeFrom <= :now)', { now })
      .andWhere('(rule.activeTo IS NULL OR rule.activeTo >= :now)', { now })
      .orderBy('rule.conflictPriorityRank', 'DESC')
      .getMany();

    return entities.map((entity) => RewardRuleMapper.toDomain(entity));
  }

  async findByProgramIdAndEarningDomain(
    programId: number,
    earningDomain: string,
  ): Promise<RewardRule[]> {
    const entities = await this.rewardRuleRepository.find({
      where: { programId, earningDomain },
      relations: ['eligibilityRelation', 'pointsFormulaRelation'],
      order: { conflictPriorityRank: 'DESC', createdAt: 'ASC' },
    });

    return entities.map((entity) => RewardRuleMapper.toDomain(entity));
  }

  async findActiveByProgramIdAndEarningDomain(
    programId: number,
    earningDomain: string,
  ): Promise<RewardRule[]> {
    const now = new Date();
    const entities = await this.rewardRuleRepository
      .createQueryBuilder('rule')
      .leftJoinAndSelect('rule.eligibilityRelation', 'eligibility')
      .leftJoinAndSelect('eligibility.membershipStatuses', 'membershipStatuses')
      .leftJoinAndSelect('eligibility.flags', 'flags')
      .leftJoinAndSelect('eligibility.categoryIds', 'categoryIds')
      .leftJoinAndSelect('eligibility.skus', 'skus')
      .leftJoinAndSelect('rule.pointsFormulaRelation', 'pointsFormula')
      .leftJoinAndSelect('pointsFormula.tableEntries', 'tableEntries')
      .leftJoinAndSelect('pointsFormula.bonuses', 'bonuses')
      .leftJoinAndSelect('bonuses.bonusFormula', 'bonusFormula')
      .leftJoinAndSelect('bonuses.eligibility', 'bonusEligibility')
      .where('rule.programId = :programId', { programId })
      .andWhere('rule.earningDomain = :earningDomain', { earningDomain })
      .andWhere('rule.status = :status', { status: 'active' })
      .andWhere('(rule.activeFrom IS NULL OR rule.activeFrom <= :now)', { now })
      .andWhere('(rule.activeTo IS NULL OR rule.activeTo >= :now)', { now })
      .orderBy('rule.conflictPriorityRank', 'DESC')
      .getMany();

    return entities.map((entity) => RewardRuleMapper.toDomain(entity));
  }

  async findByProgramIdAndConflictGroup(
    programId: number,
    conflictGroup: string,
  ): Promise<RewardRule[]> {
    const entities = await this.rewardRuleRepository.find({
      where: { programId, conflictGroup },
      relations: ['eligibilityRelation', 'pointsFormulaRelation'],
      order: { conflictPriorityRank: 'DESC', createdAt: 'ASC' },
    });

    return entities.map((entity) => RewardRuleMapper.toDomain(entity));
  }

  async findActiveByProgramIdAndConflictGroup(
    programId: number,
    conflictGroup: string,
  ): Promise<RewardRule[]> {
    const now = new Date();
    const entities = await this.rewardRuleRepository
      .createQueryBuilder('rule')
      .leftJoinAndSelect('rule.eligibilityRelation', 'eligibility')
      .leftJoinAndSelect('eligibility.membershipStatuses', 'membershipStatuses')
      .leftJoinAndSelect('eligibility.flags', 'flags')
      .leftJoinAndSelect('eligibility.categoryIds', 'categoryIds')
      .leftJoinAndSelect('eligibility.skus', 'skus')
      .leftJoinAndSelect('rule.pointsFormulaRelation', 'pointsFormula')
      .leftJoinAndSelect('pointsFormula.tableEntries', 'tableEntries')
      .leftJoinAndSelect('pointsFormula.bonuses', 'bonuses')
      .leftJoinAndSelect('bonuses.bonusFormula', 'bonusFormula')
      .leftJoinAndSelect('bonuses.eligibility', 'bonusEligibility')
      .where('rule.programId = :programId', { programId })
      .andWhere('rule.conflictGroup = :conflictGroup', { conflictGroup })
      .andWhere('rule.status = :status', { status: 'active' })
      .andWhere('(rule.activeFrom IS NULL OR rule.activeFrom <= :now)', { now })
      .andWhere('(rule.activeTo IS NULL OR rule.activeTo >= :now)', { now })
      .orderBy('rule.conflictPriorityRank', 'DESC')
      .getMany();

    return entities.map((entity) => RewardRuleMapper.toDomain(entity));
  }

  async findActiveByProgramIdTriggerAndEarningDomain(
    programId: number,
    trigger: RewardRule['trigger'],
    earningDomain: string,
  ): Promise<RewardRule[]> {
    const now = new Date();
    const entities = await this.rewardRuleRepository
      .createQueryBuilder('rule')
      .leftJoinAndSelect('rule.eligibilityRelation', 'eligibility')
      .leftJoinAndSelect('eligibility.membershipStatuses', 'membershipStatuses')
      .leftJoinAndSelect('eligibility.flags', 'flags')
      .leftJoinAndSelect('eligibility.categoryIds', 'categoryIds')
      .leftJoinAndSelect('eligibility.skus', 'skus')
      .leftJoinAndSelect('rule.pointsFormulaRelation', 'pointsFormula')
      .leftJoinAndSelect('pointsFormula.tableEntries', 'tableEntries')
      .leftJoinAndSelect('pointsFormula.bonuses', 'bonuses')
      .leftJoinAndSelect('bonuses.bonusFormula', 'bonusFormula')
      .leftJoinAndSelect('bonuses.eligibility', 'bonusEligibility')
      .where('rule.programId = :programId', { programId })
      .andWhere('rule.trigger = :trigger', { trigger })
      .andWhere('rule.earningDomain = :earningDomain', { earningDomain })
      .andWhere('rule.status = :status', { status: 'active' })
      .andWhere('(rule.activeFrom IS NULL OR rule.activeFrom <= :now)', { now })
      .andWhere('(rule.activeTo IS NULL OR rule.activeTo >= :now)', { now })
      .orderBy('rule.conflictPriorityRank', 'DESC')
      .getMany();

    return entities.map((entity) => RewardRuleMapper.toDomain(entity));
  }

  async countActiveByProgramId(programId: number): Promise<number> {
    const now = new Date();
    return await this.rewardRuleRepository
      .createQueryBuilder('rule')
      .where('rule.programId = :programId', { programId })
      .andWhere('rule.status = :status', { status: 'active' })
      .andWhere('(rule.activeFrom IS NULL OR rule.activeFrom <= :now)', { now })
      .andWhere('(rule.activeTo IS NULL OR rule.activeTo >= :now)', { now })
      .getCount();
  }

  async delete(id: number): Promise<void> {
    await this.rewardRuleRepository.delete(id);
  }
}
