/**
 * Entidad de dominio RedemptionCode
 * Representa un código de canje generado cuando un cliente canjea una recompensa
 * No depende de frameworks ni librerías externas
 */
export type RedemptionCodeStatus = 'pending' | 'used' | 'expired' | 'cancelled';

export class RedemptionCode {
  constructor(
    public readonly id: number,
    public readonly code: string,
    public readonly transactionId: number,
    public readonly rewardId: number,
    public readonly membershipId: number,
    public readonly tenantId: number,
    public readonly status: RedemptionCodeStatus,
    public readonly expiresAt: Date | null,
    public readonly usedAt: Date | null,
    public readonly usedBy: number | null, // partnerId que validó el código
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo código de canje
   */
  static create(
    code: string,
    transactionId: number,
    rewardId: number,
    membershipId: number,
    tenantId: number,
    expiresAt: Date | null = null,
    id?: number,
  ): RedemptionCode {
    // Validaciones de dominio
    if (!code || code.trim().length === 0) {
      throw new Error('code is required');
    }
    if (code.length < 8 || code.length > 50) {
      throw new Error('code must be between 8 and 50 characters');
    }
    if (transactionId <= 0) {
      throw new Error('transactionId must be greater than 0');
    }
    if (rewardId <= 0) {
      throw new Error('rewardId must be greater than 0');
    }
    if (membershipId <= 0) {
      throw new Error('membershipId must be greater than 0');
    }
    if (tenantId <= 0) {
      throw new Error('tenantId must be greater than 0');
    }
    if (expiresAt && expiresAt <= new Date()) {
      throw new Error('expiresAt must be in the future');
    }

    const now = new Date();
    return new RedemptionCode(
      id || 0,
      code.trim(),
      transactionId,
      rewardId,
      membershipId,
      tenantId,
      'pending',
      expiresAt,
      null,
      null,
      id ? now : now,
      now,
    );
  }

  /**
   * Verifica si el código está expirado
   */
  isExpired(): boolean {
    if (!this.expiresAt) {
      return false;
    }
    return new Date() > this.expiresAt;
  }

  /**
   * Verifica si el código es válido para usar
   */
  isValid(): boolean {
    if (this.status !== 'pending') {
      return false;
    }
    if (this.isExpired()) {
      return false;
    }
    return true;
  }

  /**
   * Marca el código como usado (inmutable)
   */
  markAsUsed(usedBy: number): RedemptionCode {
    if (this.status !== 'pending') {
      throw new Error(`Cannot mark code as used: current status is ${this.status}`);
    }
    if (this.isExpired()) {
      throw new Error('Cannot mark expired code as used');
    }
    if (usedBy <= 0) {
      throw new Error('usedBy must be greater than 0');
    }

    return new RedemptionCode(
      this.id,
      this.code,
      this.transactionId,
      this.rewardId,
      this.membershipId,
      this.tenantId,
      'used',
      this.expiresAt,
      new Date(),
      usedBy,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Cancela el código (inmutable)
   */
  cancel(): RedemptionCode {
    if (this.status === 'used') {
      throw new Error('Cannot cancel a code that has already been used');
    }
    if (this.status === 'cancelled') {
      return this; // Ya está cancelado
    }

    return new RedemptionCode(
      this.id,
      this.code,
      this.transactionId,
      this.rewardId,
      this.membershipId,
      this.tenantId,
      'cancelled',
      this.expiresAt,
      this.usedAt,
      this.usedBy,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Marca el código como expirado (inmutable)
   */
  markAsExpired(): RedemptionCode {
    if (this.status === 'used') {
      throw new Error('Cannot expire a code that has already been used');
    }
    if (this.status === 'expired') {
      return this; // Ya está expirado
    }

    return new RedemptionCode(
      this.id,
      this.code,
      this.transactionId,
      this.rewardId,
      this.membershipId,
      this.tenantId,
      'expired',
      this.expiresAt,
      this.usedAt,
      this.usedBy,
      this.createdAt,
      new Date(),
    );
  }
}
