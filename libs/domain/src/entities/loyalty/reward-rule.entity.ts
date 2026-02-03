import { EarningDomain, isValidEarningDomain } from '../../constants/earning-domains';
import {
  ConflictGroup,
  StackPolicy,
  isValidConflictGroup,
  isValidStackPolicy,
} from '../../constants/conflict-groups';

/**
 * Entidad de dominio RewardRule
 * Representa una regla de recompensa dentro de un programa de lealtad
 * No depende de frameworks ni librerías externas
 *
 * HARD RULES:
 * - conflictGroup requerido
 * - stackPolicy requerido
 * - idempotencyScope requerido
 * - earningDomain requerido (exactamente 1)
 */
export type RewardRuleTrigger =
  | 'VISIT'
  | 'PURCHASE'
  | 'REFERRAL'
  | 'SUBSCRIPTION'
  | 'RETENTION'
  | 'CUSTOM';

export type RewardRuleStatus = 'active' | 'inactive' | 'draft';

export interface RewardRuleScope {
  tenantId: number; // Obligatorio
  programId: number; // Obligatorio (recomendado)
  storeId?: number | null;
  branchId?: number | null;
  channel?: string | null; // ej: "online", "in-store", "mobile"
  categoryId?: number | null;
  sku?: string | null;
}

export interface EligibilityConditions {
  // Condiciones de customer/membership
  minTierId?: number | null;
  maxTierId?: number | null;
  membershipStatus?: ('active' | 'inactive')[] | null;
  minMembershipAgeDays?: number | null; // Antigüedad mínima
  flags?: string[] | null; // Flags/segmentos
  // Condiciones del evento
  minAmount?: number | null;
  maxAmount?: number | null;
  minItems?: number | null;
  categoryIds?: number[] | null;
  skus?: string[] | null;
  // Condiciones de fecha/hora
  dayOfWeek?: number[] | null; // 0-6 (domingo-sábado)
  timeRange?: { start: string; end: string } | null; // HH:mm formato
  // Metadata adicional
  metadata?: Record<string, any> | null;
}

export type PointsFormulaType = 'fixed' | 'rate' | 'table' | 'hybrid';

export interface FixedPointsFormula {
  type: 'fixed';
  points: number;
}

export interface RatePointsFormula {
  type: 'rate';
  rate: number; // Puntos por unidad (ej: 1 punto por $1)
  amountField: 'netAmount' | 'grossAmount'; // Campo del evento a usar
  roundingPolicy: 'floor' | 'ceil' | 'nearest';
  minPoints?: number | null;
  maxPoints?: number | null;
}

export interface TablePointsFormula {
  type: 'table';
  table: Array<{
    min: number;
    max: number | null; // null = sin máximo
    points: number;
  }>;
  amountField: 'netAmount' | 'grossAmount';
}

export interface HybridPointsFormula {
  type: 'hybrid';
  base: FixedPointsFormula | RatePointsFormula;
  bonuses: Array<{
    condition: EligibilityConditions;
    bonus: FixedPointsFormula | RatePointsFormula;
  }>;
}

export type PointsFormula =
  | FixedPointsFormula
  | RatePointsFormula
  | TablePointsFormula
  | HybridPointsFormula;

export interface RewardRuleLimits {
  frequency?: 'per-event' | 'daily' | 'weekly' | 'monthly' | 'per-period' | null;
  cooldownHours?: number | null; // No repetir por X horas
  perEventCap?: number | null; // Máximo puntos por evento
  perPeriodCap?: number | null; // Máximo puntos por periodo
  periodType?: 'rolling' | 'calendar' | null; // Para perPeriodCap
  periodDays?: number | null; // ej: 30 para rolling 30 días
}

export interface ConflictSettings {
  conflictGroup: ConflictGroup; // REQUERIDO
  stackPolicy: StackPolicy; // REQUERIDO
  priorityRank: number; // Mayor = mayor prioridad
  maxAwardsPerEvent?: number | null; // Máximo awards por evento en este conflictGroup
}

export type IdempotencyScopeStrategy =
  | 'default' // (tenant, membership, program, rule, sourceEventId)
  | 'per-day' // + bucketKey=YYYY-MM-DD
  | 'per-period' // + bucketKey según periodo
  | 'per-event'; // Solo sourceEventId

export interface IdempotencyScope {
  strategy: IdempotencyScopeStrategy;
  bucketTimezone?: string | null; // Timezone para buckets (ej: "America/Guatemala")
  periodDays?: number | null; // Para per-period strategy
}

export class RewardRule {
  constructor(
    public readonly id: number,
    public readonly programId: number,
    public readonly name: string,
    public readonly description: string | null,
    public readonly trigger: RewardRuleTrigger,
    public readonly scope: RewardRuleScope,
    public readonly eligibility: EligibilityConditions,
    public readonly pointsFormula: PointsFormula,
    public readonly limits: RewardRuleLimits,
    public readonly conflict: ConflictSettings,
    public readonly idempotencyScope: IdempotencyScope,
    public readonly earningDomain: EarningDomain, // REQUERIDO - exactamente 1
    public readonly status: RewardRuleStatus,
    public readonly version: number, // Versionado para inmutabilidad histórica
    public readonly activeFrom: Date | null,
    public readonly activeTo: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear una nueva regla de recompensa
   */
  static create(
    programId: number,
    name: string,
    trigger: RewardRuleTrigger,
    scope: RewardRuleScope,
    eligibility: EligibilityConditions,
    pointsFormula: PointsFormula,
    limits: RewardRuleLimits,
    conflict: ConflictSettings,
    idempotencyScope: IdempotencyScope,
    earningDomain: EarningDomain,
    description: string | null = null,
    status: RewardRuleStatus = 'draft',
    version: number = 1,
    activeFrom: Date | null = null,
    activeTo: Date | null = null,
    id?: number,
  ): RewardRule {
    // Validaciones de dominio (HARD RULES)
    if (!conflict.conflictGroup) {
      throw new Error('conflictGroup is required');
    }
    if (!isValidConflictGroup(conflict.conflictGroup)) {
      throw new Error(`Invalid conflictGroup: ${conflict.conflictGroup}. Must be from catalog.`);
    }

    if (!conflict.stackPolicy) {
      throw new Error('stackPolicy is required');
    }
    if (!isValidStackPolicy(conflict.stackPolicy)) {
      throw new Error(`Invalid stackPolicy: ${conflict.stackPolicy}. Must be from catalog.`);
    }

    if (!idempotencyScope.strategy) {
      throw new Error('idempotencyScope.strategy is required');
    }

    if (!earningDomain) {
      throw new Error('earningDomain is required');
    }
    if (!isValidEarningDomain(earningDomain)) {
      throw new Error(`Invalid earningDomain: ${earningDomain}. Must be from catalog.`);
    }

    if (conflict.priorityRank < 0) {
      throw new Error('priorityRank must be non-negative');
    }

    // Validación específica para trigger PURCHASE
    if (trigger === 'PURCHASE') {
      if (pointsFormula.type === 'rate' || pointsFormula.type === 'table') {
        if (!('amountField' in pointsFormula)) {
          throw new Error('PURCHASE trigger requires amountField in pointsFormula');
        }
      }
    }

    // Validación para cooldown/per-day requiere bucket timezone
    if (
      (limits.frequency === 'daily' || limits.cooldownHours) &&
      idempotencyScope.strategy === 'per-day' &&
      !idempotencyScope.bucketTimezone
    ) {
      throw new Error('per-day idempotencyScope requires bucketTimezone');
    }

    const now = new Date();
    return new RewardRule(
      id || 0,
      programId,
      name,
      description,
      trigger,
      scope,
      eligibility,
      pointsFormula,
      limits,
      conflict,
      idempotencyScope,
      earningDomain,
      status,
      version,
      activeFrom,
      activeTo,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si la regla está activa
   */
  isActive(): boolean {
    if (this.status !== 'active') {
      return false;
    }

    const now = new Date();

    // Si tiene activeFrom y aún no ha comenzado
    if (this.activeFrom && now < this.activeFrom) {
      return false;
    }

    // Si tiene activeTo y ya expiró
    if (this.activeTo && now > this.activeTo) {
      return false;
    }

    return true;
  }

  /**
   * Método de dominio para activar la regla
   */
  activate(activeFrom?: Date): RewardRule {
    return new RewardRule(
      this.id,
      this.programId,
      this.name,
      this.description,
      this.trigger,
      this.scope,
      this.eligibility,
      this.pointsFormula,
      this.limits,
      this.conflict,
      this.idempotencyScope,
      this.earningDomain,
      'active',
      this.version,
      activeFrom || this.activeFrom || new Date(),
      this.activeTo,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para desactivar la regla
   */
  deactivate(): RewardRule {
    return new RewardRule(
      this.id,
      this.programId,
      this.name,
      this.description,
      this.trigger,
      this.scope,
      this.eligibility,
      this.pointsFormula,
      this.limits,
      this.conflict,
      this.idempotencyScope,
      this.earningDomain,
      'inactive',
      this.version,
      this.activeFrom,
      new Date(), // activeTo = ahora
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para crear una nueva versión de la regla (inmutabilidad)
   */
  createNewVersion(
    updates: Partial<{
      name: string;
      description: string | null;
      trigger: RewardRuleTrigger;
      scope: RewardRuleScope;
      eligibility: EligibilityConditions;
      pointsFormula: PointsFormula;
      limits: RewardRuleLimits;
      conflict: ConflictSettings;
      idempotencyScope: IdempotencyScope;
      earningDomain: EarningDomain;
    }>,
  ): RewardRule {
    return new RewardRule(
      this.id, // Mismo ID para nueva versión (o 0 si es completamente nuevo)
      this.programId,
      updates.name ?? this.name,
      updates.description ?? this.description,
      updates.trigger ?? this.trigger,
      updates.scope ?? this.scope,
      updates.eligibility ?? this.eligibility,
      updates.pointsFormula ?? this.pointsFormula,
      updates.limits ?? this.limits,
      updates.conflict ?? this.conflict,
      updates.idempotencyScope ?? this.idempotencyScope,
      updates.earningDomain ?? this.earningDomain,
      this.status,
      this.version + 1, // Incrementar versión
      this.activeFrom,
      this.activeTo,
      this.createdAt,
      new Date(),
    );
  }
}
