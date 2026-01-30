import {
  RewardRule,
  RewardRuleScope,
  EligibilityConditions,
  PointsFormula,
  FixedPointsFormula,
  RatePointsFormula,
  RewardRuleLimits,
  ConflictSettings,
  IdempotencyScope,
} from '@libs/domain';
import { ConflictGroup, StackPolicy } from '@libs/domain';
import { RewardRuleEntity } from '../entities/reward-rule.entity';
import { RewardRuleEligibilityEntity } from '../entities/reward-rule-eligibility.entity';
import { RewardRulePointsFormulaEntity } from '../entities/reward-rule-points-formula.entity';
import { RewardRulePointsTableEntryEntity } from '../entities/reward-rule-points-table-entry.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class RewardRuleMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   * Usa las nuevas columnas relacionales como fuente de verdad
   */
  static toDomain(persistenceEntity: RewardRuleEntity): RewardRule {
    // Construir scope desde columnas directas
    const scope: RewardRuleScope = {
      tenantId: persistenceEntity.scopeTenantId,
      programId: persistenceEntity.scopeProgramId,
      storeId: persistenceEntity.scopeStoreId ?? null,
      branchId: persistenceEntity.scopeBranchId ?? null,
      channel: persistenceEntity.scopeChannel ?? null,
      categoryId: persistenceEntity.scopeCategoryId ?? null,
      sku: persistenceEntity.scopeSku ?? null,
    };

    // Construir eligibility desde tabla relacionada
    const eligibility: EligibilityConditions = persistenceEntity.eligibilityRelation
      ? this.buildEligibilityFromRelation(persistenceEntity.eligibilityRelation)
      : {
          minTierId: null,
          maxTierId: null,
          membershipStatus: null,
          minMembershipAgeDays: null,
          flags: null,
          minAmount: null,
          maxAmount: null,
          minItems: null,
          categoryIds: null,
          skus: null,
          dayOfWeek: null,
          timeRange: null,
          metadata: null,
        };

    // Construir pointsFormula desde tabla relacionada
    const pointsFormula: PointsFormula = persistenceEntity.pointsFormulaRelation
      ? this.buildPointsFormulaFromRelation(persistenceEntity.pointsFormulaRelation)
      : {
          type: 'fixed',
          points: 0,
        };

    // Construir limits desde columnas directas
    const limits: RewardRuleLimits | null = persistenceEntity.limitFrequency !== null ||
      persistenceEntity.limitCooldownHours !== null ||
      persistenceEntity.limitPerEventCap !== null ||
      persistenceEntity.limitPerPeriodCap !== null
      ? {
          frequency: persistenceEntity.limitFrequency ?? null,
          cooldownHours: persistenceEntity.limitCooldownHours ?? null,
          perEventCap: persistenceEntity.limitPerEventCap ?? null,
          perPeriodCap: persistenceEntity.limitPerPeriodCap ?? null,
          periodType: persistenceEntity.limitPeriodType ?? null,
          periodDays: persistenceEntity.limitPeriodDays ?? null,
        }
      : null;

    // Construir conflict desde columnas directas
    const conflict: ConflictSettings = {
      conflictGroup: persistenceEntity.conflictGroup as ConflictGroup,
      stackPolicy: persistenceEntity.conflictStackPolicy as StackPolicy,
      priorityRank: persistenceEntity.conflictPriorityRank,
      maxAwardsPerEvent: persistenceEntity.conflictMaxAwardsPerEvent ?? null,
    };

    // Construir idempotencyScope desde columnas directas
    const idempotencyScope: IdempotencyScope = {
      strategy: persistenceEntity.idempotencyStrategy,
      bucketTimezone: persistenceEntity.idempotencyBucketTimezone ?? null,
      periodDays: persistenceEntity.idempotencyPeriodDays ?? null,
    };

    return new RewardRule(
      persistenceEntity.id,
      persistenceEntity.programId,
      persistenceEntity.name,
      persistenceEntity.description,
      persistenceEntity.trigger as RewardRule['trigger'],
      scope,
      eligibility,
      pointsFormula,
      limits,
      conflict,
      idempotencyScope,
      persistenceEntity.earningDomain as RewardRule['earningDomain'],
      persistenceEntity.status as RewardRule['status'],
      persistenceEntity.version,
      persistenceEntity.activeFrom,
      persistenceEntity.activeTo,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Construye EligibilityConditions desde la entidad relacionada
   */
  private static buildEligibilityFromRelation(
    eligibilityEntity: RewardRuleEligibilityEntity,
  ): EligibilityConditions {
    return {
      minTierId: eligibilityEntity.minTierId ?? null,
      maxTierId: eligibilityEntity.maxTierId ?? null,
      membershipStatus:
        eligibilityEntity.membershipStatuses?.map((s) => s.status) ?? null,
      minMembershipAgeDays: eligibilityEntity.minMembershipAgeDays ?? null,
      flags: eligibilityEntity.flags?.map((f) => f.flag) ?? null,
      minAmount: eligibilityEntity.minAmount ?? null,
      maxAmount: eligibilityEntity.maxAmount ?? null,
      minItems: eligibilityEntity.minItems ?? null,
      categoryIds: eligibilityEntity.categoryIds?.map((c) => c.categoryId) ?? null,
      skus: eligibilityEntity.skus?.map((s) => s.sku) ?? null,
      dayOfWeek: eligibilityEntity.dayOfWeek ?? null,
      timeRange:
        eligibilityEntity.timeRangeStart && eligibilityEntity.timeRangeEnd
          ? {
              start: this.formatTime(eligibilityEntity.timeRangeStart),
              end: this.formatTime(eligibilityEntity.timeRangeEnd),
            }
          : null,
      metadata: eligibilityEntity.metadata
        ? (JSON.parse(eligibilityEntity.metadata) as Record<string, any>)
        : null,
    };
  }

  /**
   * Construye PointsFormula desde la entidad relacionada
   */
  private static buildPointsFormulaFromRelation(
    formulaEntity: RewardRulePointsFormulaEntity,
  ): PointsFormula {
    switch (formulaEntity.formulaType) {
      case 'fixed':
        return {
          type: 'fixed',
          points: formulaEntity.fixedPoints!,
        };

      case 'rate':
        return {
          type: 'rate',
          rate: formulaEntity.rateRate!,
          amountField: formulaEntity.rateAmountField!,
          roundingPolicy: formulaEntity.rateRoundingPolicy!,
          minPoints: formulaEntity.rateMinPoints ?? null,
          maxPoints: formulaEntity.rateMaxPoints ?? null,
        };

      case 'table':
        return {
          type: 'table',
          table:
            formulaEntity.tableEntries?.map((entry) => ({
              min: entry.minValue,
              max: entry.maxValue,
              points: entry.points,
            })) ?? [],
          amountField: formulaEntity.rateAmountField!,
        };

      case 'hybrid':
        // Para fórmulas híbridas, necesitamos cargar la fórmula base recursivamente
        // Por ahora, usamos tableData como fallback si está disponible
        if (formulaEntity.tableData) {
          const tableData = formulaEntity.tableData as any;
          return {
            type: 'hybrid',
            base: (tableData.base || { type: 'fixed', points: 0 }) as
              | FixedPointsFormula
              | RatePointsFormula,
            bonuses: (tableData.bonuses || []) as Array<{
              condition: EligibilityConditions;
              bonus: FixedPointsFormula | RatePointsFormula;
            }>,
          };
        }
        // Si no hay tableData, construimos desde las relaciones
        const baseFormulaRaw = formulaEntity.hybridBaseFormula
          ? this.buildPointsFormulaFromRelation(formulaEntity.hybridBaseFormula)
          : ({ type: 'fixed', points: 0 } as PointsFormula);

        // Validar que baseFormula sea solo fixed o rate (no table o hybrid)
        const baseFormula: FixedPointsFormula | RatePointsFormula =
          baseFormulaRaw.type === 'fixed' || baseFormulaRaw.type === 'rate'
            ? (baseFormulaRaw as FixedPointsFormula | RatePointsFormula)
            : ({ type: 'fixed', points: 0 } as FixedPointsFormula);

        return {
          type: 'hybrid',
          base: baseFormula,
          bonuses:
            formulaEntity.bonuses?.map((bonus) => {
              const bonusFormulaRaw = this.buildPointsFormulaFromRelation(
                bonus.bonusFormula,
              );
              // Validar que bonus sea solo fixed o rate
              const bonusFormula: FixedPointsFormula | RatePointsFormula =
                bonusFormulaRaw.type === 'fixed' || bonusFormulaRaw.type === 'rate'
                  ? (bonusFormulaRaw as FixedPointsFormula | RatePointsFormula)
                  : ({ type: 'fixed', points: 0 } as FixedPointsFormula);

              return {
                condition: bonus.eligibility
                  ? this.buildEligibilityFromRelation(bonus.eligibility)
                  : ({} as EligibilityConditions),
                bonus: bonusFormula,
              };
            }) ?? [],
        };

      default:
        return { type: 'fixed', points: 0 };
    }
  }

  /**
   * Formatea un objeto Date/Time a string HH:mm
   */
  private static formatTime(time: Date | string): string {
    if (typeof time === 'string') {
      return time;
    }
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   * Si el ID es 0, no se asigna para que la BD lo genere automáticamente
   *
   * NOTA: Esta función solo actualiza las columnas directas.
   * Las tablas relacionadas (eligibility, pointsFormula) deben manejarse
   * por separado o mediante cascadas configuradas en TypeORM.
   */
  static toPersistence(domainEntity: RewardRule): Partial<RewardRuleEntity> {
    const entity: Partial<RewardRuleEntity> = {};

    // Solo asignar ID si es mayor a 0 (regla existente)
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }

    entity.programId = domainEntity.programId;
    entity.name = domainEntity.name;
    entity.description = domainEntity.description;
    entity.trigger = domainEntity.trigger;
    entity.earningDomain = domainEntity.earningDomain;
    entity.conflictGroup = domainEntity.conflict.conflictGroup; // Extraer para índice
    entity.status = domainEntity.status;
    entity.version = domainEntity.version;
    entity.activeFrom = domainEntity.activeFrom;
    entity.activeTo = domainEntity.activeTo;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;

    // Mapear scope a columnas directas
    entity.scopeTenantId = domainEntity.scope.tenantId;
    entity.scopeProgramId = domainEntity.scope.programId;
    entity.scopeStoreId = domainEntity.scope.storeId ?? null;
    entity.scopeBranchId = domainEntity.scope.branchId ?? null;
    entity.scopeChannel = domainEntity.scope.channel ?? null;
    entity.scopeCategoryId = domainEntity.scope.categoryId ?? null;
    entity.scopeSku = domainEntity.scope.sku ?? null;

    // Mapear conflict a columnas directas
    entity.conflictStackPolicy = domainEntity.conflict.stackPolicy;
    entity.conflictPriorityRank = domainEntity.conflict.priorityRank;
    entity.conflictMaxAwardsPerEvent = domainEntity.conflict.maxAwardsPerEvent ?? null;

    // Mapear idempotencyScope a columnas directas
    entity.idempotencyStrategy = domainEntity.idempotencyScope.strategy;
    entity.idempotencyBucketTimezone = domainEntity.idempotencyScope.bucketTimezone ?? null;
    entity.idempotencyPeriodDays = domainEntity.idempotencyScope.periodDays ?? null;

    // Mapear limits a columnas directas
    if (domainEntity.limits) {
      entity.limitFrequency = domainEntity.limits.frequency ?? null;
      entity.limitCooldownHours = domainEntity.limits.cooldownHours ?? null;
      entity.limitPerEventCap = domainEntity.limits.perEventCap ?? null;
      entity.limitPerPeriodCap = domainEntity.limits.perPeriodCap ?? null;
      entity.limitPeriodType = domainEntity.limits.periodType ?? null;
      entity.limitPeriodDays = domainEntity.limits.periodDays ?? null;
    } else {
      entity.limitFrequency = null;
      entity.limitCooldownHours = null;
      entity.limitPerEventCap = null;
      entity.limitPerPeriodCap = null;
      entity.limitPeriodType = null;
      entity.limitPeriodDays = null;
    }


    return entity;
  }

  /**
   * Convierte EligibilityConditions a RewardRuleEligibilityEntity
   * Usado para crear/actualizar la relación de elegibilidad
   */
  static eligibilityToPersistence(
    eligibility: EligibilityConditions,
    rewardRuleId: number,
  ): Partial<RewardRuleEligibilityEntity> {
    const entity: Partial<RewardRuleEligibilityEntity> = {
      rewardRuleId,
      minTierId: eligibility.minTierId ?? null,
      maxTierId: eligibility.maxTierId ?? null,
      minMembershipAgeDays: eligibility.minMembershipAgeDays ?? null,
      minAmount: eligibility.minAmount ?? null,
      maxAmount: eligibility.maxAmount ?? null,
      minItems: eligibility.minItems ?? null,
      dayOfWeek: eligibility.dayOfWeek ?? null,
      timeRangeStart: eligibility.timeRange?.start
        ? this.parseTime(eligibility.timeRange.start)
        : null,
      timeRangeEnd: eligibility.timeRange?.end
        ? this.parseTime(eligibility.timeRange.end)
        : null,
      metadata: eligibility.metadata ? JSON.stringify(eligibility.metadata) : null,
    };

    return entity;
  }

  /**
   * Convierte PointsFormula a RewardRulePointsFormulaEntity
   * Usado para crear/actualizar la relación de fórmula de puntos
   */
  static pointsFormulaToPersistence(
    formula: PointsFormula,
    rewardRuleId: number,
  ): Partial<RewardRulePointsFormulaEntity> {
    const entity: Partial<RewardRulePointsFormulaEntity> = {
      rewardRuleId,
      formulaType: formula.type,
    };

    switch (formula.type) {
      case 'fixed':
        entity.fixedPoints = formula.points;
        break;

      case 'rate':
        entity.rateRate = formula.rate;
        entity.rateAmountField = formula.amountField;
        entity.rateRoundingPolicy = formula.roundingPolicy;
        entity.rateMinPoints = formula.minPoints ?? null;
        entity.rateMaxPoints = formula.maxPoints ?? null;
        break;

      case 'table':
        entity.rateAmountField = formula.amountField;
        // Las entradas de tabla se manejan por separado
        break;

      case 'hybrid':
        // Para fórmulas híbridas, guardamos en tableData temporalmente
        // hasta implementar la lógica completa de relaciones recursivas
        entity.tableData = {
          base: formula.base,
          bonuses: formula.bonuses,
        } as any;
        break;
    }

    return entity;
  }

  /**
   * Parsea un string HH:mm a Date
   */
  private static parseTime(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
}
