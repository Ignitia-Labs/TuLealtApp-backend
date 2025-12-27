/**
 * Entidad de dominio PartnerSubscription
 * Representa la suscripción de un partner
 * No depende de frameworks ni librerías externas
 */
export type SubscriptionStatus =
  | 'active'
  | 'expired'
  | 'suspended'
  | 'cancelled'
  | 'trialing'
  | 'past_due'
  | 'paused';
export type PlanType = 'esencia' | 'conecta' | 'inspira';
export type BillingFrequency = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export class PartnerSubscription {
  constructor(
    public readonly id: number,
    public readonly partnerId: number,
    public readonly planId: string,
    public readonly planType: PlanType,
    public readonly startDate: Date,
    public readonly renewalDate: Date,
    public readonly status: SubscriptionStatus,
    public readonly billingFrequency: BillingFrequency,
    public readonly billingAmount: number,
    public readonly includeTax: boolean,
    public readonly taxPercent: number | null,
    public readonly basePrice: number,
    public readonly taxAmount: number,
    public readonly totalPrice: number,
    public readonly currency: string,
    public readonly nextBillingDate: Date,
    public readonly nextBillingAmount: number,
    public readonly currentPeriodStart: Date,
    public readonly currentPeriodEnd: Date,
    public readonly trialEndDate: Date | null,
    public readonly pausedAt: Date | null,
    public readonly pauseReason: string | null,
    public readonly gracePeriodDays: number,
    public readonly retryAttempts: number,
    public readonly maxRetryAttempts: number,
    public readonly creditBalance: number,
    public readonly discountPercent: number | null,
    public readonly discountCode: string | null,
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
    planType: PlanType,
    startDate: Date,
    renewalDate: Date,
    billingFrequency: BillingFrequency,
    billingAmount: number,
    currency: string,
    nextBillingDate: Date,
    nextBillingAmount: number,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    includeTax: boolean = false,
    taxPercent: number | null = null,
    basePrice?: number,
    taxAmount?: number,
    totalPrice?: number,
    status: SubscriptionStatus = 'active',
    trialEndDate: Date | null = null,
    pausedAt: Date | null = null,
    pauseReason: string | null = null,
    gracePeriodDays: number = 7,
    retryAttempts: number = 0,
    maxRetryAttempts: number = 3,
    creditBalance: number = 0,
    discountPercent: number | null = null,
    discountCode: string | null = null,
    lastPaymentDate: Date | null = null,
    lastPaymentAmount: number | null = null,
    paymentStatus: 'paid' | 'pending' | 'failed' | null = null,
    autoRenew: boolean = true,
    id?: number,
  ): PartnerSubscription {
    const now = new Date();

    // Calcular valores de IVA si no se proporcionan
    let calculatedBasePrice = basePrice;
    let calculatedTaxAmount = taxAmount;
    let calculatedTotalPrice = totalPrice;

    if (calculatedBasePrice === undefined || calculatedTaxAmount === undefined || calculatedTotalPrice === undefined) {
      calculatedBasePrice = billingAmount;

      if (includeTax && taxPercent !== null && taxPercent > 0) {
        calculatedTaxAmount = calculatedBasePrice * (taxPercent / 100);
        calculatedTotalPrice = calculatedBasePrice + calculatedTaxAmount;
      } else {
        calculatedTaxAmount = 0;
        calculatedTotalPrice = calculatedBasePrice;
      }
    }

    return new PartnerSubscription(
      id || 0,
      partnerId,
      planId,
      planType,
      startDate,
      renewalDate,
      status,
      billingFrequency,
      billingAmount,
      includeTax,
      taxPercent,
      calculatedBasePrice,
      calculatedTaxAmount,
      calculatedTotalPrice,
      currency,
      nextBillingDate,
      nextBillingAmount,
      currentPeriodStart,
      currentPeriodEnd,
      trialEndDate,
      pausedAt,
      pauseReason,
      gracePeriodDays,
      retryAttempts,
      maxRetryAttempts,
      creditBalance,
      discountPercent,
      discountCode,
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
  updateStatus(status: SubscriptionStatus): PartnerSubscription {
    return new PartnerSubscription(
      this.id,
      this.partnerId,
      this.planId,
      this.planType,
      this.startDate,
      this.renewalDate,
      status,
      this.billingFrequency,
      this.billingAmount,
      this.includeTax,
      this.taxPercent,
      this.basePrice,
      this.taxAmount,
      this.totalPrice,
      this.currency,
      this.nextBillingDate,
      this.nextBillingAmount,
      this.currentPeriodStart,
      this.currentPeriodEnd,
      this.trialEndDate,
      this.pausedAt,
      this.pauseReason,
      this.gracePeriodDays,
      this.retryAttempts,
      this.maxRetryAttempts,
      this.creditBalance,
      this.discountPercent,
      this.discountCode,
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
  recordPayment(amount: number, paymentStatus: 'paid' | 'pending' | 'failed'): PartnerSubscription {
    return new PartnerSubscription(
      this.id,
      this.partnerId,
      this.planId,
      this.planType,
      this.startDate,
      this.renewalDate,
      this.status,
      this.billingFrequency,
      this.billingAmount,
      this.includeTax,
      this.taxPercent,
      this.basePrice,
      this.taxAmount,
      this.totalPrice,
      this.currency,
      this.nextBillingDate,
      this.nextBillingAmount,
      this.currentPeriodStart,
      this.currentPeriodEnd,
      this.trialEndDate,
      this.pausedAt,
      this.pauseReason,
      this.gracePeriodDays,
      this.retryAttempts,
      this.maxRetryAttempts,
      this.creditBalance,
      this.discountPercent,
      this.discountCode,
      new Date(),
      amount,
      paymentStatus,
      this.autoRenew,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para pausar la suscripción
   */
  pause(reason: string): PartnerSubscription {
    return new PartnerSubscription(
      this.id,
      this.partnerId,
      this.planId,
      this.planType,
      this.startDate,
      this.renewalDate,
      'paused',
      this.billingFrequency,
      this.billingAmount,
      this.includeTax,
      this.taxPercent,
      this.basePrice,
      this.taxAmount,
      this.totalPrice,
      this.currency,
      this.nextBillingDate,
      this.nextBillingAmount,
      this.currentPeriodStart,
      this.currentPeriodEnd,
      this.trialEndDate,
      new Date(),
      reason,
      this.gracePeriodDays,
      this.retryAttempts,
      this.maxRetryAttempts,
      this.creditBalance,
      this.discountPercent,
      this.discountCode,
      this.lastPaymentDate,
      this.lastPaymentAmount,
      this.paymentStatus,
      this.autoRenew,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para reanudar la suscripción
   */
  resume(): PartnerSubscription {
    return new PartnerSubscription(
      this.id,
      this.partnerId,
      this.planId,
      this.planType,
      this.startDate,
      this.renewalDate,
      'active',
      this.billingFrequency,
      this.billingAmount,
      this.includeTax,
      this.taxPercent,
      this.basePrice,
      this.taxAmount,
      this.totalPrice,
      this.currency,
      this.nextBillingDate,
      this.nextBillingAmount,
      this.currentPeriodStart,
      this.currentPeriodEnd,
      this.trialEndDate,
      null,
      null,
      this.gracePeriodDays,
      this.retryAttempts,
      this.maxRetryAttempts,
      this.creditBalance,
      this.discountPercent,
      this.discountCode,
      this.lastPaymentDate,
      this.lastPaymentAmount,
      this.paymentStatus,
      this.autoRenew,
      this.createdAt,
      new Date(),
    );
  }
}
