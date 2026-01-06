/**
 * Entidad de dominio Transaction
 * Representa una transacción de puntos (ganancia, canje, expiración, ajuste)
 * No depende de frameworks ni librerías externas
 */
export type TransactionType = 'earn' | 'redeem' | 'expire' | 'adjust';
export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'cancelled';

export class Transaction {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly membershipId: number | null, // FK a customer_memberships (opcional para compatibilidad)
    public readonly type: TransactionType,
    public readonly points: number, // Positivo para ganar, negativo para canjear/expirar
    public readonly description: string,
    public readonly metadata: Record<string, any> | null,
    public readonly status: TransactionStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    // Nuevos campos para transacciones de compra
    public readonly cashierId: number | null = null,
    public readonly transactionDate: Date | null = null,
    public readonly transactionAmountTotal: number | null = null,
    public readonly netAmount: number | null = null,
    public readonly taxAmount: number | null = null,
    public readonly itemsCount: number | null = null,
    public readonly transactionReference: string | null = null,
    public readonly pointsEarned: number | null = null, // Puntos ganados (siempre positivo para earn)
    public readonly pointsRuleId: number | null = null,
    // Campos calculados automáticamente
    public readonly pointsMultiplier: number | null = null,
    public readonly basePoints: number | null = null,
    public readonly bonusPoints: number | null = null,
  ) {}

  /**
   * Factory method para crear una nueva transacción
   */
  static create(
    userId: number,
    type: TransactionType,
    points: number,
    description: string,
    metadata: Record<string, any> | null = null,
    status: TransactionStatus = 'completed',
    membershipId: number | null = null,
    id?: number,
    // Nuevos campos opcionales
    cashierId?: number | null,
    transactionDate?: Date | null,
    transactionAmountTotal?: number | null,
    netAmount?: number | null,
    taxAmount?: number | null,
    itemsCount?: number | null,
    transactionReference?: string | null,
    pointsEarned?: number | null,
    pointsRuleId?: number | null,
    pointsMultiplier?: number | null,
    basePoints?: number | null,
    bonusPoints?: number | null,
  ): Transaction {
    const now = new Date();
    return new Transaction(
      id || 0,
      userId,
      membershipId,
      type,
      points,
      description,
      metadata,
      status,
      now,
      now,
      cashierId ?? null,
      transactionDate ?? null,
      transactionAmountTotal ?? null,
      netAmount ?? null,
      taxAmount ?? null,
      itemsCount ?? null,
      transactionReference ?? null,
      pointsEarned ?? null,
      pointsRuleId ?? null,
      pointsMultiplier ?? null,
      basePoints ?? null,
      bonusPoints ?? null,
    );
  }

  /**
   * Factory method para crear una transacción de ganancia de puntos
   */
  static createEarn(
    userId: number,
    points: number,
    description: string,
    metadata: Record<string, any> | null = null,
    membershipId: number | null = null,
    // Nuevos campos opcionales
    cashierId?: number | null,
    transactionDate?: Date | null,
    transactionAmountTotal?: number | null,
    netAmount?: number | null,
    taxAmount?: number | null,
    itemsCount?: number | null,
    transactionReference?: string | null,
    pointsEarned?: number | null,
    pointsRuleId?: number | null,
    pointsMultiplier?: number | null,
    basePoints?: number | null,
    bonusPoints?: number | null,
  ): Transaction {
    const pointsEarnedValue = pointsEarned ?? Math.abs(points);
    return Transaction.create(
      userId,
      'earn',
      Math.abs(points),
      description,
      metadata,
      'completed',
      membershipId,
      undefined,
      cashierId,
      transactionDate,
      transactionAmountTotal,
      netAmount,
      taxAmount,
      itemsCount,
      transactionReference,
      pointsEarnedValue,
      pointsRuleId,
      pointsMultiplier,
      basePoints,
      bonusPoints,
    );
  }

  /**
   * Factory method para crear una transacción de canje de puntos
   */
  static createRedeem(
    userId: number,
    points: number,
    description: string,
    metadata: Record<string, any> | null = null,
    membershipId: number | null = null,
  ): Transaction {
    return Transaction.create(
      userId,
      'redeem',
      -Math.abs(points),
      description,
      metadata,
      'completed',
      membershipId,
    );
  }

  /**
   * Factory method para crear una transacción de expiración de puntos
   */
  static createExpire(
    userId: number,
    points: number,
    description: string,
    membershipId: number | null = null,
  ): Transaction {
    return Transaction.create(
      userId,
      'expire',
      -Math.abs(points),
      description,
      null,
      'completed',
      membershipId,
    );
  }

  /**
   * Factory method para crear una transacción de ajuste manual
   */
  static createAdjust(
    userId: number,
    points: number,
    description: string,
    metadata: Record<string, any> | null = null,
    membershipId: number | null = null,
  ): Transaction {
    return Transaction.create(
      userId,
      'adjust',
      points,
      description,
      metadata,
      'completed',
      membershipId,
    );
  }

  /**
   * Método de dominio para verificar si la transacción está completada
   */
  isCompleted(): boolean {
    return this.status === 'completed';
  }

  /**
   * Método de dominio para completar una transacción pendiente
   */
  complete(): Transaction {
    return new Transaction(
      this.id,
      this.userId,
      this.membershipId,
      this.type,
      this.points,
      this.description,
      this.metadata,
      'completed',
      this.createdAt,
      new Date(),
      this.cashierId,
      this.transactionDate,
      this.transactionAmountTotal,
      this.netAmount,
      this.taxAmount,
      this.itemsCount,
      this.transactionReference,
      this.pointsEarned,
      this.pointsRuleId,
      this.pointsMultiplier,
      this.basePoints,
      this.bonusPoints,
    );
  }

  /**
   * Método de dominio para cancelar una transacción
   */
  cancel(): Transaction {
    return new Transaction(
      this.id,
      this.userId,
      this.membershipId,
      this.type,
      this.points,
      this.description,
      this.metadata,
      'cancelled',
      this.createdAt,
      new Date(),
      this.cashierId,
      this.transactionDate,
      this.transactionAmountTotal,
      this.netAmount,
      this.taxAmount,
      this.itemsCount,
      this.transactionReference,
      this.pointsEarned,
      this.pointsRuleId,
      this.pointsMultiplier,
      this.basePoints,
      this.bonusPoints,
    );
  }
}
