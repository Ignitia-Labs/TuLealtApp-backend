/**
 * Entidad de dominio CustomerMembership
 * Representa la membresía de un customer en un tenant específico
 * No depende de frameworks ni librerías externas
 *
 * IMPORTANTE: El campo `points` es una PROYECCIÓN calculada desde el ledger (points_transactions).
 * NO debe actualizarse directamente. Todos los cambios de puntos deben pasar por el ledger
 * usando transacciones PointsTransaction. Este campo se mantiene para performance y compatibilidad
 * con queries existentes, pero la fuente de verdad es el ledger.
 */
export class CustomerMembership {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly tenantId: number,
    public readonly registrationBranchId: number | null,
    /**
     * Proyección calculada desde points_transactions ledger.
     * SOLO LECTURA - NO actualizar directamente.
     * Usar PointsTransaction para cambios de puntos.
     */
    public readonly points: number,
    public readonly tierId: number | null,
    public readonly totalSpent: number,
    public readonly totalVisits: number,
    public readonly lastVisit: Date | null,
    public readonly joinedDate: Date,
    public readonly qrCode: string | null,
    public readonly status: 'active' | 'inactive',
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear una nueva membership
   * El ID es opcional porque será generado automáticamente por la base de datos
   */
  static create(
    userId: number,
    tenantId: number,
    registrationBranchId: number | null = null,
    points: number = 0,
    tierId: number | null = null,
    totalSpent: number = 0,
    totalVisits: number = 0,
    lastVisit: Date | null = null,
    joinedDate: Date = new Date(),
    qrCode: string | null = null,
    status: 'active' | 'inactive' = 'active',
    id?: number,
  ): CustomerMembership {
    const now = new Date();
    return new CustomerMembership(
      id || 0,
      userId,
      tenantId,
      registrationBranchId,
      points,
      tierId,
      totalSpent,
      totalVisits,
      lastVisit,
      joinedDate,
      qrCode,
      status,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si la membership está activa
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Método de dominio para agregar puntos a la membership
   * @deprecated Este método está deprecado. Los puntos deben actualizarse a través del ledger (PointsTransaction).
   * Este método será removido en una versión futura. Use el sistema de ledger para cambios de puntos.
   * @see PointsTransaction
   */
  addPoints(amount: number): CustomerMembership {
    const newPoints = Math.max(0, this.points + amount);
    return new CustomerMembership(
      this.id,
      this.userId,
      this.tenantId,
      this.registrationBranchId,
      newPoints,
      this.tierId,
      this.totalSpent,
      this.totalVisits,
      this.lastVisit,
      this.joinedDate,
      this.qrCode,
      this.status,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para restar puntos de la membership
   * @deprecated Este método está deprecado. Los puntos deben actualizarse a través del ledger (PointsTransaction).
   * Este método será removido en una versión futura. Use el sistema de ledger para cambios de puntos.
   * @see PointsTransaction
   */
  subtractPoints(amount: number): CustomerMembership {
    const newPoints = Math.max(0, this.points - amount);
    return new CustomerMembership(
      this.id,
      this.userId,
      this.tenantId,
      this.registrationBranchId,
      newPoints,
      this.tierId,
      this.totalSpent,
      this.totalVisits,
      this.lastVisit,
      this.joinedDate,
      this.qrCode,
      this.status,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para registrar una visita
   */
  recordVisit(): CustomerMembership {
    return new CustomerMembership(
      this.id,
      this.userId,
      this.tenantId,
      this.registrationBranchId,
      this.points,
      this.tierId,
      this.totalSpent,
      this.totalVisits + 1,
      new Date(),
      this.joinedDate,
      this.qrCode,
      this.status,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para registrar una compra
   */
  recordPurchase(amount: number): CustomerMembership {
    return new CustomerMembership(
      this.id,
      this.userId,
      this.tenantId,
      this.registrationBranchId,
      this.points,
      this.tierId,
      this.totalSpent + amount,
      this.totalVisits,
      this.lastVisit,
      this.joinedDate,
      this.qrCode,
      this.status,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para actualizar el tier
   */
  updateTier(tierId: number | null): CustomerMembership {
    return new CustomerMembership(
      this.id,
      this.userId,
      this.tenantId,
      this.registrationBranchId,
      this.points,
      tierId,
      this.totalSpent,
      this.totalVisits,
      this.lastVisit,
      this.joinedDate,
      this.qrCode,
      this.status,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para activar la membership
   */
  activate(): CustomerMembership {
    return new CustomerMembership(
      this.id,
      this.userId,
      this.tenantId,
      this.registrationBranchId,
      this.points,
      this.tierId,
      this.totalSpent,
      this.totalVisits,
      this.lastVisit,
      this.joinedDate,
      this.qrCode,
      'active',
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para desactivar la membership
   */
  deactivate(): CustomerMembership {
    return new CustomerMembership(
      this.id,
      this.userId,
      this.tenantId,
      this.registrationBranchId,
      this.points,
      this.tierId,
      this.totalSpent,
      this.totalVisits,
      this.lastVisit,
      this.joinedDate,
      this.qrCode,
      'inactive',
      this.createdAt,
      new Date(),
    );
  }
}
