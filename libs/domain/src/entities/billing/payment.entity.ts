/**
 * Entidad de dominio Payment
 * Representa un pago realizado para una suscripción/factura
 * No depende de frameworks ni librerías externas
 */
export type PaymentStatus =
  | 'pending' // Pago iniciado pero no completado
  | 'pending_validation' // Pago completado, pendiente de validación por backoffice
  | 'validated' // Pago validado por backoffice (reemplaza 'paid')
  | 'rejected' // Pago rechazado por backoffice
  | 'failed' // Pago fallido técnicamente
  | 'refunded' // Pago reembolsado
  | 'cancelled' // Pago cancelado
  | 'paid'; // Deprecated: usar 'validated' en su lugar (se mantiene por compatibilidad)
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
    public readonly isPartialPayment: boolean,
    public readonly validatedBy: number | null,
    public readonly validatedAt: Date | null,
    public readonly rejectedBy: number | null,
    public readonly rejectedAt: Date | null,
    public readonly rejectionReason: string | null,
    public readonly image: string | null,
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
    status: PaymentStatus = 'pending_validation',
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
    isPartialPayment: boolean = false,
    image: string | null = null,
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
      isPartialPayment,
      null, // validatedBy
      null, // validatedAt
      null, // rejectedBy
      null, // rejectedAt
      null, // rejectionReason
      image,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si el pago está completado
   */
  isCompleted(): boolean {
    return this.status === 'validated' || this.status === 'paid';
  }

  /**
   * Método de dominio para verificar si el pago está validado
   */
  isValidated(): boolean {
    return this.status === 'validated' || this.status === 'paid';
  }

  /**
   * Método de dominio para verificar si el pago puede ser procesado
   */
  canBeProcessed(): boolean {
    return this.status === 'validated' || this.status === 'paid';
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
      'validated',
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
      this.isPartialPayment,
      this.validatedBy,
      this.validatedAt,
      this.rejectedBy,
      this.rejectedAt,
      this.rejectionReason,
      this.image,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para marcar el pago como validado
   */
  markAsValidated(validatedBy: number, validatedAt: Date = new Date()): Payment {
    return new Payment(
      this.id,
      this.subscriptionId,
      this.partnerId,
      this.invoiceId,
      this.billingCycleId,
      this.amount,
      this.currency,
      this.paymentMethod,
      'validated',
      this.paymentDate,
      validatedAt,
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
      this.isPartialPayment,
      validatedBy,
      validatedAt,
      this.rejectedBy,
      this.rejectedAt,
      this.rejectionReason,
      this.image,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para marcar el pago como rechazado
   */
  markAsRejected(
    rejectedBy: number,
    rejectionReason: string,
    rejectedAt: Date = new Date(),
  ): Payment {
    return new Payment(
      this.id,
      this.subscriptionId,
      this.partnerId,
      this.invoiceId,
      this.billingCycleId,
      this.amount,
      this.currency,
      this.paymentMethod,
      'rejected',
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
      this.notes,
      this.processedBy,
      this.originalPaymentId,
      this.isPartialPayment,
      this.validatedBy,
      this.validatedAt,
      rejectedBy,
      rejectedAt,
      rejectionReason,
      this.image,
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
      this.isPartialPayment,
      this.validatedBy,
      this.validatedAt,
      this.rejectedBy,
      this.rejectedAt,
      this.rejectionReason,
      this.image,
      this.createdAt,
      new Date(),
    );
  }
}
