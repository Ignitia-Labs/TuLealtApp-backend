/**
 * Entidad de dominio PointsRule
 * Representa una regla para ganar puntos
 * No depende de frameworks ni librerías externas
 */
export type PointsRuleType = 'purchase' | 'birthday' | 'referral' | 'visit' | 'custom';

export type ApplicableHours = {
  start: string; // Format: "HH:mm" (e.g., "09:00")
  end: string; // Format: "HH:mm" (e.g., "18:00")
};

export class PointsRule {
  constructor(
    public readonly id: number,
    public readonly tenantId: number,
    public readonly name: string,
    public readonly description: string,
    public readonly type: PointsRuleType,
    public readonly pointsPerUnit: number,
    public readonly multiplier: number | null,
    public readonly minAmount: number | null,
    public readonly applicableDays: number[] | null, // 0 = Domingo, 1 = Lunes, etc.
    public readonly applicableHours: ApplicableHours | null,
    public readonly validFrom: Date | null,
    public readonly validUntil: Date | null,
    public readonly status: 'active' | 'inactive',
    public readonly priority: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear una nueva regla de puntos
   */
  static create(
    tenantId: number,
    name: string,
    description: string,
    type: PointsRuleType,
    pointsPerUnit: number,
    priority: number = 1,
    multiplier: number | null = null,
    minAmount: number | null = null,
    applicableDays: number[] | null = null,
    applicableHours: ApplicableHours | null = null,
    validFrom: Date | null = null,
    validUntil: Date | null = null,
    status: 'active' | 'inactive' = 'active',
    id?: number,
  ): PointsRule {
    const now = new Date();
    return new PointsRule(
      id || 0,
      tenantId,
      name,
      description,
      type,
      pointsPerUnit,
      multiplier,
      minAmount,
      applicableDays,
      applicableHours,
      validFrom,
      validUntil,
      status,
      priority,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si la regla está activa
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Método de dominio para calcular puntos basado en la regla
   */
  calculatePoints(amount: number, dayOfWeek?: number): number {
    if (!this.isActive()) {
      return 0;
    }

    // Verificar día aplicable
    if (this.applicableDays !== null && dayOfWeek !== undefined) {
      if (!this.applicableDays.includes(dayOfWeek)) {
        return 0;
      }
    }

    // Verificar monto mínimo
    if (this.minAmount !== null && amount < this.minAmount) {
      return 0;
    }

    // Calcular puntos base
    let points = this.pointsPerUnit * amount;

    // Aplicar multiplicador si existe
    if (this.multiplier !== null) {
      points = points * this.multiplier;
    }

    return Math.floor(points);
  }

  /**
   * Método de dominio para verificar si la regla aplica para un día específico
   */
  appliesToDay(dayOfWeek: number): boolean {
    if (this.applicableDays === null) {
      return true;
    }
    return this.applicableDays.includes(dayOfWeek);
  }
}
