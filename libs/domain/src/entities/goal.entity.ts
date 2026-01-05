/**
 * Entidad de dominio Goal
 * Representa una meta de suscripción
 * No depende de frameworks ni librerías externas
 */

export type GoalMetric =
  | 'mrr'
  | 'arr'
  | 'activeSubscriptions'
  | 'churnRate'
  | 'retentionRate'
  | 'newSubscriptions'
  | 'upgrades';

export type GoalStatus = 'on_track' | 'at_risk' | 'behind' | 'achieved';

export class Goal {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly description: string | null,
    public readonly metric: GoalMetric,
    public readonly targetValue: number,
    public readonly periodStart: Date,
    public readonly periodEnd: Date,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear una nueva meta
   */
  static create(
    name: string,
    description: string | null,
    metric: GoalMetric,
    targetValue: number,
    periodStart: Date,
    periodEnd: Date,
    isActive: boolean = true,
    id?: number,
  ): Goal {
    const now = new Date();
    return new Goal(
      id || 0,
      name,
      description,
      metric,
      targetValue,
      periodStart,
      periodEnd,
      isActive,
      now,
      now,
    );
  }

  /**
   * Calcula el valor actual según la métrica y las estadísticas proporcionadas
   */
  calculateCurrentValue(stats: {
    mrr: number;
    arr: number;
    activeSubscriptions: number;
    churnRate: number;
    retentionRate: number;
    newSubscriptions: number;
    upgrades: number;
  }): number {
    switch (this.metric) {
      case 'mrr':
        return stats.mrr;
      case 'arr':
        return stats.arr;
      case 'activeSubscriptions':
        return stats.activeSubscriptions;
      case 'churnRate':
        return stats.churnRate;
      case 'retentionRate':
        return stats.retentionRate;
      case 'newSubscriptions':
        return stats.newSubscriptions;
      case 'upgrades':
        return stats.upgrades;
      default:
        return 0;
    }
  }

  /**
   * Calcula el progreso como porcentaje
   */
  calculateProgress(currentValue: number): number {
    if (this.targetValue === 0) {
      return currentValue > 0 ? 100 : 0;
    }
    return Math.min(100, (currentValue / this.targetValue) * 100);
  }

  /**
   * Determina el estado de la meta basado en el progreso y la proyección
   */
  determineStatus(progress: number, projection: number): GoalStatus {
    if (progress >= 100) {
      return 'achieved';
    }

    if (projection >= 100) {
      return 'on_track';
    }

    if (projection >= 80) {
      return 'at_risk';
    }

    return 'behind';
  }

  /**
   * Actualiza el estado activo de la meta
   */
  updateActiveStatus(isActive: boolean): Goal {
    return new Goal(
      this.id,
      this.name,
      this.description,
      this.metric,
      this.targetValue,
      this.periodStart,
      this.periodEnd,
      isActive,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Actualiza los datos de la meta
   */
  update(
    name?: string,
    description?: string | null,
    targetValue?: number,
    periodStart?: Date,
    periodEnd?: Date,
    isActive?: boolean,
  ): Goal {
    return new Goal(
      this.id,
      name ?? this.name,
      description !== undefined ? description : this.description,
      this.metric,
      targetValue ?? this.targetValue,
      periodStart ?? this.periodStart,
      periodEnd ?? this.periodEnd,
      isActive !== undefined ? isActive : this.isActive,
      this.createdAt,
      new Date(),
    );
  }
}
