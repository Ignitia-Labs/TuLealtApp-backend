import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRewardRuleRepository, RewardRule } from '@libs/domain';
import { RewardRuleEntity } from '@libs/infrastructure/entities/loyalty/reward-rule.entity';
import { RewardRuleEligibilityEntity } from '@libs/infrastructure/entities/loyalty/reward-rule-eligibility.entity';
import { RewardRulePointsFormulaEntity } from '@libs/infrastructure/entities/loyalty/reward-rule-points-formula.entity';
import { RewardRuleMapper } from '@libs/infrastructure/mappers/loyalty/reward-rule.mapper';

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

    // Si es una actualización (id > 0), eliminar relaciones existentes solo si se están actualizando
    if (rule.id > 0) {
      const existingEntity = await this.rewardRuleRepository.findOne({
        where: { id: rule.id },
        relations: ['eligibilityRelation', 'pointsFormulaRelation'],
      });

      if (existingEntity) {
        // Eliminar eligibility existente solo si vamos a crear una nueva
        // (si entity.eligibilityRelation existe, significa que el mapper la construyó)
        if (existingEntity.eligibilityRelation && entity.eligibilityRelation) {
          await this.rewardRuleRepository.manager.delete(
            RewardRuleEligibilityEntity,
            existingEntity.eligibilityRelation.id,
          );
        }
        // Si no vamos a crear nueva pero existe una antigua, eliminarla (caso de eliminación explícita)
        else if (existingEntity.eligibilityRelation && !entity.eligibilityRelation) {
          await this.rewardRuleRepository.manager.delete(
            RewardRuleEligibilityEntity,
            existingEntity.eligibilityRelation.id,
          );
        }

        // Eliminar pointsFormula existente solo si vamos a crear una nueva
        if (existingEntity.pointsFormulaRelation && entity.pointsFormulaRelation) {
          await this.rewardRuleRepository.manager.delete(
            RewardRulePointsFormulaEntity,
            existingEntity.pointsFormulaRelation.id,
          );
        }
        // Si no vamos a crear nueva pero existe una antigua, eliminarla (caso de eliminación explícita)
        else if (existingEntity.pointsFormulaRelation && !entity.pointsFormulaRelation) {
          await this.rewardRuleRepository.manager.delete(
            RewardRulePointsFormulaEntity,
            existingEntity.pointsFormulaRelation.id,
          );
        }
      }
    }

    // Guardar la entidad principal con sus relaciones
    // TypeORM guardará automáticamente las relaciones OneToMany con cascade: true
    const savedEntity = await this.rewardRuleRepository.save(entity);

    // Cargar relaciones completas después de guardar para el mapper
    const entityWithRelations = await this.rewardRuleRepository.findOne({
      where: { id: savedEntity.id },
      relations: [
        'eligibilityRelation',
        'eligibilityRelation.membershipStatuses',
        'eligibilityRelation.flags',
        'eligibilityRelation.categoryIds',
        'eligibilityRelation.skus',
        'pointsFormulaRelation',
        'pointsFormulaRelation.tableEntries',
        'pointsFormulaRelation.bonuses',
        'pointsFormulaRelation.bonuses.bonusFormula',
        'pointsFormulaRelation.bonuses.eligibility',
      ],
    });

    return RewardRuleMapper.toDomain(entityWithRelations || savedEntity);
  }

  async findById(id: number): Promise<RewardRule | null> {
    const entity = await this.rewardRuleRepository.findOne({
      where: { id },
      relations: [
        'eligibilityRelation',
        'eligibilityRelation.membershipStatuses',
        'eligibilityRelation.flags',
        'eligibilityRelation.categoryIds',
        'eligibilityRelation.skus',
        'pointsFormulaRelation',
        'pointsFormulaRelation.tableEntries',
        'pointsFormulaRelation.bonuses',
        'pointsFormulaRelation.bonuses.bonusFormula',
        'pointsFormulaRelation.bonuses.eligibility',
      ],
    });

    if (!entity) {
      return null;
    }

    return RewardRuleMapper.toDomain(entity);
  }

  async findByProgramId(programId: number): Promise<RewardRule[]> {
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
      .orderBy('rule.conflictPriorityRank', 'DESC')
      .addOrderBy('rule.createdAt', 'ASC')
      .getMany();

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
      .orderBy('rule.conflictPriorityRank', 'DESC')
      .addOrderBy('rule.createdAt', 'ASC')
      .getMany();

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
      .orderBy('rule.conflictPriorityRank', 'DESC')
      .addOrderBy('rule.createdAt', 'ASC')
      .getMany();

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
      .orderBy('rule.conflictPriorityRank', 'DESC')
      .addOrderBy('rule.createdAt', 'ASC')
      .getMany();

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

  /**
   * Busca múltiples reglas por sus IDs (batch query)
   * Optimización para evitar N+1 queries
   */
  async findByIds(ids: number[]): Promise<RewardRule[]> {
    if (ids.length === 0) {
      return [];
    }

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
      .whereInIds(ids)
      .getMany();

    return entities.map((entity) => RewardRuleMapper.toDomain(entity));
  }

  /**
   * Busca reglas activas de múltiples programas por trigger (batch query)
   * Optimización para evitar N+1 queries en ProcessLoyaltyEventHandler
   */
  async findActiveByProgramIdsAndTrigger(
    programIds: number[],
    trigger: RewardRule['trigger'],
  ): Promise<RewardRule[]> {
    if (programIds.length === 0) {
      return [];
    }

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
      .where('rule.programId IN (:...programIds)', { programIds })
      .andWhere('rule.trigger = :trigger', { trigger })
      .andWhere('rule.status = :status', { status: 'active' })
      .andWhere('(rule.activeFrom IS NULL OR rule.activeFrom <= :now)', { now })
      .andWhere('(rule.activeTo IS NULL OR rule.activeTo >= :now)', { now })
      .orderBy('rule.conflictPriorityRank', 'DESC')
      .addOrderBy('rule.createdAt', 'ASC')
      .getMany();

    return entities.map((entity) => RewardRuleMapper.toDomain(entity));
  }
}
