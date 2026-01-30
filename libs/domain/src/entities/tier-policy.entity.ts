/**
 * Entidad de dominio TierPolicy
 * Representa una política de evaluación de tiers para un tenant
 * Define cómo y cuándo se evalúan los tiers de los miembros
 * No depende de frameworks ni librerías externas
 */

export type EvaluationWindow = 'MONTHLY' | 'QUARTERLY' | 'ROLLING_30' | 'ROLLING_90';
export type EvaluationType = 'FIXED' | 'ROLLING';
export type DowngradeStrategy = 'IMMEDIATE' | 'GRACE_PERIOD' | 'NEVER';
export type TierPolicyStatus = 'active' | 'inactive' | 'draft';

/**
 * Thresholds para evaluación de tiers
 * Define los puntos mínimos requeridos para cada tier
 */
export interface TierThresholds {
  [tierId: number]: number; // tierId -> minPoints requeridos
}

export class TierPolicy {
  constructor(
    public readonly id: number,
    public readonly tenantId: number,
    public readonly evaluationWindow: EvaluationWindow,
    public readonly evaluationType: EvaluationType,
    public readonly thresholds: TierThresholds, // JSON: { tierId: minPoints }
    public readonly gracePeriodDays: number, // Días de gracia antes de downgrade
    public readonly minTierDuration: number, // Días mínimos que debe estar en un tier antes de poder cambiar
    public readonly downgradeStrategy: DowngradeStrategy,
    public readonly status: TierPolicyStatus,
    public readonly description: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear una nueva política de tier
   */
  static create(
    tenantId: number,
    evaluationWindow: EvaluationWindow,
    evaluationType: EvaluationType,
    thresholds: TierThresholds,
    gracePeriodDays: number = 30,
    minTierDuration: number = 0,
    downgradeStrategy: DowngradeStrategy = 'GRACE_PERIOD',
    description: string | null = null,
    status: TierPolicyStatus = 'draft',
    id?: number,
  ): TierPolicy {
    // Validaciones de dominio
    if (gracePeriodDays < 0) {
      throw new Error('Grace period days must be non-negative');
    }

    if (minTierDuration < 0) {
      throw new Error('Minimum tier duration must be non-negative');
    }

    if (Object.keys(thresholds).length === 0) {
      throw new Error('Thresholds must contain at least one tier');
    }

    // Validar que todos los thresholds sean números positivos
    for (const [tierId, minPoints] of Object.entries(thresholds)) {
      if (minPoints < 0) {
        throw new Error(`Threshold for tier ${tierId} must be non-negative`);
      }
    }

    const now = new Date();
    return new TierPolicy(
      id || 0,
      tenantId,
      evaluationWindow,
      evaluationType,
      thresholds,
      gracePeriodDays,
      minTierDuration,
      downgradeStrategy,
      status,
      description,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si la política está activa
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Método de dominio para verificar si permite downgrades
   */
  allowsDowngrade(): boolean {
    return this.downgradeStrategy !== 'NEVER';
  }

  /**
   * Método de dominio para verificar si usa grace period
   */
  usesGracePeriod(): boolean {
    return this.downgradeStrategy === 'GRACE_PERIOD' && this.gracePeriodDays > 0;
  }

  /**
   * Método de dominio para obtener el mínimo de puntos requerido para un tier específico
   */
  getMinPointsForTier(tierId: number): number | null {
    return this.thresholds[tierId] ?? null;
  }

  /**
   * Método de dominio para verificar si un tier está definido en los thresholds
   */
  hasTier(tierId: number): boolean {
    return tierId in this.thresholds;
  }

  /**
   * Método de dominio para obtener todos los tier IDs ordenados por puntos mínimos
   */
  getTiersOrderedByPoints(): number[] {
    return Object.entries(this.thresholds)
      .sort(([, pointsA], [, pointsB]) => pointsA - pointsB)
      .map(([tierId]) => parseInt(tierId, 10));
  }
}
