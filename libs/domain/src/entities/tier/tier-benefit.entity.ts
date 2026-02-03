/**
 * Entidad de dominio TierBenefit
 * Representa los beneficios específicos de un tier en un programa de lealtad
 * Define multiplicadores, recompensas exclusivas, límites más altos, etc.
 * No depende de frameworks ni librerías externas
 */

/**
 * Beneficios por categoría
 */
export interface CategoryBenefits {
  [categoryId: number]: {
    pointsMultiplier?: number; // Multiplicador específico para esta categoría
    exclusiveRewards?: string[]; // IDs de recompensas exclusivas
  };
}

export class TierBenefit {
  constructor(
    public readonly id: number,
    public readonly programId: number,
    public readonly tierId: number,
    public readonly pointsMultiplier: number | null, // Multiplicador global de puntos (ej: 1.25 = 25% bonus)
    public readonly exclusiveRewards: string[], // IDs de recompensas exclusivas para este tier
    public readonly higherCaps: {
      maxPointsPerEvent?: number | null;
      maxPointsPerDay?: number | null;
      maxPointsPerMonth?: number | null;
    } | null, // Límites más altos para este tier
    public readonly cooldownReduction: number | null, // Reducción de cooldown en horas (ej: 12 = reduce 12 horas)
    public readonly categoryBenefits: CategoryBenefits | null, // Beneficios específicos por categoría
    public readonly status: 'active' | 'inactive',
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo beneficio de tier
   */
  static create(
    programId: number,
    tierId: number,
    pointsMultiplier: number | null = null,
    exclusiveRewards: string[] = [],
    higherCaps: {
      maxPointsPerEvent?: number | null;
      maxPointsPerDay?: number | null;
      maxPointsPerMonth?: number | null;
    } | null = null,
    cooldownReduction: number | null = null,
    categoryBenefits: CategoryBenefits | null = null,
    status: 'active' | 'inactive' = 'active',
    id?: number,
  ): TierBenefit {
    // Validaciones de dominio
    if (pointsMultiplier !== null && pointsMultiplier <= 0) {
      throw new Error('Points multiplier must be positive');
    }

    if (cooldownReduction !== null && cooldownReduction < 0) {
      throw new Error('Cooldown reduction must be non-negative');
    }

    if (higherCaps) {
      if (
        higherCaps.maxPointsPerEvent !== null &&
        higherCaps.maxPointsPerEvent !== undefined &&
        higherCaps.maxPointsPerEvent < 0
      ) {
        throw new Error('Higher caps must be non-negative');
      }
      if (
        higherCaps.maxPointsPerDay !== null &&
        higherCaps.maxPointsPerDay !== undefined &&
        higherCaps.maxPointsPerDay < 0
      ) {
        throw new Error('Higher caps must be non-negative');
      }
      if (
        higherCaps.maxPointsPerMonth !== null &&
        higherCaps.maxPointsPerMonth !== undefined &&
        higherCaps.maxPointsPerMonth < 0
      ) {
        throw new Error('Higher caps must be non-negative');
      }
    }

    const now = new Date();
    return new TierBenefit(
      id || 0,
      programId,
      tierId,
      pointsMultiplier,
      exclusiveRewards,
      higherCaps,
      cooldownReduction,
      categoryBenefits,
      status,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si el beneficio está activo
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Método de dominio para aplicar multiplicador de puntos
   */
  applyMultiplier(basePoints: number): number {
    if (!this.pointsMultiplier) {
      return basePoints;
    }
    return Math.floor(basePoints * this.pointsMultiplier);
  }

  /**
   * Método de dominio para verificar si una recompensa es exclusiva
   */
  isExclusiveReward(rewardId: string): boolean {
    return this.exclusiveRewards.includes(rewardId);
  }

  /**
   * Método de dominio para obtener el límite más alto para un periodo específico
   */
  getHigherCap(period: 'event' | 'day' | 'month'): number | null {
    if (!this.higherCaps) {
      return null;
    }

    switch (period) {
      case 'event':
        return this.higherCaps.maxPointsPerEvent ?? null;
      case 'day':
        return this.higherCaps.maxPointsPerDay ?? null;
      case 'month':
        return this.higherCaps.maxPointsPerMonth ?? null;
      default:
        return null;
    }
  }

  /**
   * Método de dominio para obtener beneficios de una categoría específica
   */
  getCategoryBenefits(categoryId: number): CategoryBenefits[number] | null {
    if (!this.categoryBenefits) {
      return null;
    }
    return this.categoryBenefits[categoryId] ?? null;
  }

  /**
   * Método de dominio para aplicar reducción de cooldown
   */
  applyCooldownReduction(cooldownHours: number): number {
    if (!this.cooldownReduction) {
      return cooldownHours;
    }
    return Math.max(0, cooldownHours - this.cooldownReduction);
  }
}
