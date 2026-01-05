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
  ): Transaction {
    return Transaction.create(
      userId,
      'earn',
      Math.abs(points),
      description,
      metadata,
      'completed',
      membershipId,
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
    );
  }
}
