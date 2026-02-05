/**
 * Entidad de dominio PointsTransaction
 * Representa una transacción en el ledger de puntos (única fuente de verdad)
 * No depende de frameworks ni librerías externas
 *
 * Esta entidad es INMUTABLE - una vez creada, nunca se modifica.
 * Todas las operaciones crean nuevas transacciones.
 */
export type PointsTransactionType =
  | 'EARNING'
  | 'REDEEM'
  | 'ADJUSTMENT'
  | 'REVERSAL'
  | 'EXPIRATION'
  | 'HOLD'
  | 'RELEASE';

export interface PointsTransactionMetadata {
  [key: string]: any;
}

export class PointsTransaction {
  constructor(
    public readonly id: number,
    public readonly tenantId: number,
    public readonly customerId: number,
    public readonly membershipId: number,
    public readonly programId: number | null,
    public readonly rewardRuleId: number | null,
    public readonly type: PointsTransactionType,
    public readonly pointsDelta: number, // Positivo para EARNING, negativo para REDEEM/EXPIRATION
    public readonly idempotencyKey: string, // Clave única para garantizar idempotencia
    public readonly sourceEventId: string | null, // ID del evento que originó esta transacción
    public readonly correlationId: string | null, // ID para correlacionar transacciones relacionadas
    public readonly createdBy: string | null, // Usuario/sistema que creó la transacción
    public readonly reasonCode: string | null, // Código de razón para auditoría
    public readonly metadata: PointsTransactionMetadata | null, // Metadatos adicionales (JSON) - solo para auditoría, no consultable
    public readonly reversalOfTransactionId: number | null, // ID de la transacción que se revierte (solo para REVERSAL)
    public readonly expiresAt: Date | null, // Fecha de expiración de los puntos (solo para EARNING)
    public readonly rewardId: number | null, // FK a rewards.id - Solo para transacciones tipo REDEEM
    public readonly branchId: number | null, // FK a branches.id - Sucursal donde ocurrió la transacción
    public readonly createdAt: Date,
  ) {}

  /**
   * Factory method para crear una transacción de tipo EARNING
   */
  static createEarning(
    tenantId: number,
    customerId: number,
    membershipId: number,
    pointsDelta: number,
    idempotencyKey: string,
    sourceEventId: string | null = null,
    correlationId: string | null = null,
    createdBy: string | null = null,
    reasonCode: string | null = null,
    programId: number | null = null,
    rewardRuleId: number | null = null,
    metadata: PointsTransactionMetadata | null = null,
    expiresAt: Date | null = null,
    branchId: number | null = null,
    id?: number,
  ): PointsTransaction {
    if (pointsDelta <= 0) {
      throw new Error('EARNING transactions must have positive pointsDelta');
    }

    return new PointsTransaction(
      id || 0,
      tenantId,
      customerId,
      membershipId,
      programId,
      rewardRuleId,
      'EARNING',
      pointsDelta,
      idempotencyKey,
      sourceEventId,
      correlationId,
      createdBy,
      reasonCode,
      metadata,
      null,
      expiresAt,
      null, // rewardId solo para REDEEM
      branchId,
      id ? new Date() : new Date(),
    );
  }

  /**
   * Factory method para crear una transacción de tipo REDEEM
   * @param rewardId ID de la recompensa canjeada (requerido para transacciones REDEEM)
   */
  static createRedeem(
    tenantId: number,
    customerId: number,
    membershipId: number,
    pointsDelta: number, // Debe ser negativo
    idempotencyKey: string,
    rewardId: number, // Requerido para transacciones REDEEM
    sourceEventId: string | null = null,
    correlationId: string | null = null,
    createdBy: string | null = null,
    reasonCode: string | null = null,
    programId: number | null = null,
    metadata: PointsTransactionMetadata | null = null,
    branchId: number | null = null,
    id?: number,
  ): PointsTransaction {
    if (pointsDelta >= 0) {
      throw new Error('REDEEM transactions must have negative pointsDelta');
    }
    if (!rewardId || rewardId <= 0) {
      throw new Error('REDEEM transactions must have a valid rewardId');
    }

    return new PointsTransaction(
      id || 0,
      tenantId,
      customerId,
      membershipId,
      programId,
      null,
      'REDEEM',
      pointsDelta,
      idempotencyKey,
      sourceEventId,
      correlationId,
      createdBy,
      reasonCode,
      metadata,
      null,
      null,
      rewardId,
      branchId,
      id ? new Date() : new Date(),
    );
  }

  /**
   * Factory method para crear una transacción de tipo REVERSAL
   */
  static createReversal(
    tenantId: number,
    customerId: number,
    membershipId: number,
    reversalOfTransactionId: number,
    idempotencyKey: string,
    sourceEventId: string | null = null,
    correlationId: string | null = null,
    createdBy: string | null = null,
    reasonCode: string | null = null,
    metadata: PointsTransactionMetadata | null = null,
    branchId: number | null = null,
    id?: number,
  ): PointsTransaction {
    return new PointsTransaction(
      id || 0,
      tenantId,
      customerId,
      membershipId,
      null,
      null,
      'REVERSAL',
      0, // REVERSAL no tiene pointsDelta directo, se calcula desde la transacción original
      idempotencyKey,
      sourceEventId,
      correlationId,
      createdBy,
      reasonCode,
      metadata,
      reversalOfTransactionId,
      null,
      null, // rewardId solo para REDEEM
      branchId,
      id ? new Date() : new Date(),
    );
  }

  /**
   * Factory method para crear una transacción de tipo ADJUSTMENT
   */
  static createAdjustment(
    tenantId: number,
    customerId: number,
    membershipId: number,
    pointsDelta: number, // Puede ser positivo o negativo
    idempotencyKey: string,
    createdBy: string,
    reasonCode: string,
    correlationId: string | null = null,
    metadata: PointsTransactionMetadata | null = null,
    branchId: number | null = null,
    id?: number,
  ): PointsTransaction {
    if (pointsDelta === 0) {
      throw new Error('ADJUSTMENT transactions must have non-zero pointsDelta');
    }

    return new PointsTransaction(
      id || 0,
      tenantId,
      customerId,
      membershipId,
      null,
      null,
      'ADJUSTMENT',
      pointsDelta,
      idempotencyKey,
      null,
      correlationId,
      createdBy,
      reasonCode,
      metadata,
      null,
      null,
      null, // rewardId solo para REDEEM
      branchId,
      id ? new Date() : new Date(),
    );
  }

  /**
   * Factory method para crear una transacción de tipo EXPIRATION
   */
  static createExpiration(
    tenantId: number,
    customerId: number,
    membershipId: number,
    pointsDelta: number, // Debe ser negativo
    idempotencyKey: string,
    correlationId: string | null = null,
    createdBy: string | null = null,
    reasonCode: string | null = null,
    metadata: PointsTransactionMetadata | null = null,
    branchId: number | null = null,
    id?: number,
  ): PointsTransaction {
    if (pointsDelta >= 0) {
      throw new Error('EXPIRATION transactions must have negative pointsDelta');
    }

    return new PointsTransaction(
      id || 0,
      tenantId,
      customerId,
      membershipId,
      null,
      null,
      'EXPIRATION',
      pointsDelta,
      idempotencyKey,
      null,
      correlationId,
      createdBy,
      reasonCode,
      metadata,
      null,
      null,
      null, // rewardId solo para REDEEM
      branchId,
      id ? new Date() : new Date(),
    );
  }

  /**
   * Factory method para crear una transacción de tipo HOLD
   */
  static createHold(
    tenantId: number,
    customerId: number,
    membershipId: number,
    pointsDelta: number, // Debe ser negativo (puntos retenidos)
    idempotencyKey: string,
    sourceEventId: string | null = null,
    correlationId: string | null = null,
    createdBy: string | null = null,
    reasonCode: string | null = null,
    metadata: PointsTransactionMetadata | null = null,
    branchId: number | null = null,
    id?: number,
  ): PointsTransaction {
    if (pointsDelta >= 0) {
      throw new Error('HOLD transactions must have negative pointsDelta');
    }

    return new PointsTransaction(
      id || 0,
      tenantId,
      customerId,
      membershipId,
      null,
      null,
      'HOLD',
      pointsDelta,
      idempotencyKey,
      sourceEventId,
      correlationId,
      createdBy,
      reasonCode,
      metadata,
      null,
      null,
      null, // rewardId solo para REDEEM
      branchId,
      id ? new Date() : new Date(),
    );
  }

  /**
   * Factory method para crear una transacción de tipo RELEASE
   */
  static createRelease(
    tenantId: number,
    customerId: number,
    membershipId: number,
    pointsDelta: number, // Debe ser positivo (puntos liberados)
    idempotencyKey: string,
    sourceEventId: string | null = null,
    correlationId: string | null = null,
    createdBy: string | null = null,
    reasonCode: string | null = null,
    metadata: PointsTransactionMetadata | null = null,
    branchId: number | null = null,
    id?: number,
  ): PointsTransaction {
    if (pointsDelta <= 0) {
      throw new Error('RELEASE transactions must have positive pointsDelta');
    }

    return new PointsTransaction(
      id || 0,
      tenantId,
      customerId,
      membershipId,
      null,
      null,
      'RELEASE',
      pointsDelta,
      idempotencyKey,
      sourceEventId,
      correlationId,
      createdBy,
      reasonCode,
      metadata,
      null,
      null,
      null, // rewardId solo para REDEEM
      branchId,
      id ? new Date() : new Date(),
    );
  }

  /**
   * Método de dominio para verificar si la transacción es de tipo earning
   */
  isEarning(): boolean {
    return this.type === 'EARNING';
  }

  /**
   * Método de dominio para verificar si la transacción es de tipo redeem
   */
  isRedeem(): boolean {
    return this.type === 'REDEEM';
  }

  /**
   * Método de dominio para verificar si la transacción es de tipo reversal
   */
  isReversal(): boolean {
    return this.type === 'REVERSAL';
  }

  /**
   * Método de dominio para verificar si la transacción tiene puntos que expiran
   */
  hasExpiration(): boolean {
    return this.expiresAt !== null;
  }

  /**
   * Método de dominio para verificar si los puntos ya expiraron
   */
  isExpired(): boolean {
    if (!this.expiresAt) {
      return false;
    }
    return new Date() > this.expiresAt;
  }
}
