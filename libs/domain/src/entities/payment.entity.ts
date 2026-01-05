/**
 * Entidad de dominio Payment
 * Representa un pago realizado para una suscripción/factura
 * No depende de frameworks ni librerías externas
 */
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'cash' | 'other';

export class Payment {
  constructor(
    public readonly id: number,
    public readonly subscriptionId: number,
    public readonly partnerId: number,
    public readonly invoiceId: number | null,
    public readonly billingCycleId: number | null,
    public readonly amount: number,
    public readonly currency: string,
    public readonly paymentMethod: PaymentMethod,
    public readonly status: PaymentStatus,
    public readonly paymentDate: Date,
    public readonly processedDate: Date | null,
    public readonly transactionId: number | null,
    public readonly reference: string | null,
    public readonly confirmationCode: string | null,
    public readonly gateway: string | null,
    public readonly gatewayTransactionId: string | null,
    public readonly cardLastFour: string | null,
    public readonly cardBrand: string | null,
    public readonly cardExpiry: string | null,
    public readonly isRetry: boolean,
    public readonly retryAttempt: number | null,
    public readonly notes: string | null,
    public readonly processedBy: number | null,
    public readonly originalPaymentId: number | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo pago
   */
  static create(
    subscriptionId: number,
    partnerId: number,
    amount: number,
    currency: string,
    paymentMethod: PaymentMethod,
    invoiceId: number | null = null,
    billingCycleId: number | null = null,
    paymentDate: Date = new Date(),
    status: PaymentStatus = 'pending',
    transactionId: number | null = null,
    reference: string | null = null,
    confirmationCode: string | null = null,
    gateway: string | null = null,
    gatewayTransactionId: string | null = null,
    cardLastFour: string | null = null,
    cardBrand: string | null = null,
    cardExpiry: string | null = null,
    isRetry: boolean = false,
    retryAttempt: number | null = null,
    notes: string | null = null,
    processedBy: number | null = null,
    originalPaymentId: number | null = null,
    id?: number,
  ): Payment {
    const now = new Date();
    return new Payment(
      id || 0,
      subscriptionId,
      partnerId,
      invoiceId,
      billingCycleId,
      amount,
      currency,
      paymentMethod,
      status,
      paymentDate,
      null,
      transactionId,
      reference,
      confirmationCode,
      gateway,
      gatewayTransactionId,
      cardLastFour,
      cardBrand,
      cardExpiry,
      isRetry,
      retryAttempt,
      notes,
      processedBy,
      originalPaymentId,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si el pago está completado
   */
  isCompleted(): boolean {
    return this.status === 'paid';
  }

  /**
   * Método de dominio para marcar el pago como procesado
   */
  markAsProcessed(processedDate: Date = new Date()): Payment {
    return new Payment(
      this.id,
      this.subscriptionId,
      this.partnerId,
      this.invoiceId,
      this.billingCycleId,
      this.amount,
      this.currency,
      this.paymentMethod,
      'paid',
      this.paymentDate,
      processedDate,
      this.transactionId,
      this.reference,
      this.confirmationCode,
      this.gateway,
      this.gatewayTransactionId,
      this.cardLastFour,
      this.cardBrand,
      this.cardExpiry,
      this.isRetry,
      this.retryAttempt,
      this.notes,
      this.processedBy,
      this.originalPaymentId,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para marcar el pago como fallido
   */
  markAsFailed(notes: string | null = null): Payment {
    return new Payment(
      this.id,
      this.subscriptionId,
      this.partnerId,
      this.invoiceId,
      this.billingCycleId,
      this.amount,
      this.currency,
      this.paymentMethod,
      'failed',
      this.paymentDate,
      this.processedDate,
      this.transactionId,
      this.reference,
      this.confirmationCode,
      this.gateway,
      this.gatewayTransactionId,
      this.cardLastFour,
      this.cardBrand,
      this.cardExpiry,
      this.isRetry,
      this.retryAttempt,
      notes,
      this.processedBy,
      this.originalPaymentId,
      this.createdAt,
      new Date(),
    );
  }
}
