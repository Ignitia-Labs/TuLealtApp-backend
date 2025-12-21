/**
 * Entidad de dominio PartnerSubscription
 * Representa la suscripción de un partner
 * No depende de frameworks ni librerías externas
 */
export class PartnerSubscription {
  constructor(
    public readonly id: number,
    public readonly partnerId: number,
    public readonly planId: string,
    public readonly startDate: Date,
    public readonly renewalDate: Date,
    public readonly status: 'active' | 'expired' | 'suspended' | 'cancelled',
    public readonly lastPaymentDate: Date | null,
    public readonly lastPaymentAmount: number | null,
    public readonly paymentStatus: 'paid' | 'pending' | 'failed' | null,
    public readonly autoRenew: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear una nueva suscripción
   */
  static create(
    partnerId: number,
    planId: string,
    startDate: Date,
    renewalDate: Date,
    status: 'active' | 'expired' | 'suspended' | 'cancelled' = 'active',
    lastPaymentDate: Date | null = null,
    lastPaymentAmount: number | null = null,
    paymentStatus: 'paid' | 'pending' | 'failed' | null = null,
    autoRenew: boolean = true,
    id?: number,
  ): PartnerSubscription {
    const now = new Date();
    return new PartnerSubscription(
      id || 0,
      partnerId,
      planId,
      startDate,
      renewalDate,
      status,
      lastPaymentDate,
      lastPaymentAmount,
      paymentStatus,
      autoRenew,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si la suscripción está activa
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Método de dominio para actualizar el estado de la suscripción
   */
  updateStatus(
    status: 'active' | 'expired' | 'suspended' | 'cancelled',
  ): PartnerSubscription {
    return new PartnerSubscription(
      this.id,
      this.partnerId,
      this.planId,
      this.startDate,
      this.renewalDate,
      status,
      this.lastPaymentDate,
      this.lastPaymentAmount,
      this.paymentStatus,
      this.autoRenew,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para registrar un pago
   */
  recordPayment(
    amount: number,
    paymentStatus: 'paid' | 'pending' | 'failed',
  ): PartnerSubscription {
    return new PartnerSubscription(
      this.id,
      this.partnerId,
      this.planId,
      this.startDate,
      this.renewalDate,
      this.status,
      new Date(),
      amount,
      paymentStatus,
      this.autoRenew,
      this.createdAt,
      new Date(),
    );
  }
}
