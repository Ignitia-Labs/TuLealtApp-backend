/**
 * Entidad de dominio BillingCycle
 * Representa un ciclo de facturación de una suscripción
 * No depende de frameworks ni librerías externas
 */
export type BillingCycleStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type BillingCyclePaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type BillingCycleInvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export class BillingCycle {
  constructor(
    public readonly id: number,
    public readonly subscriptionId: number,
    public readonly partnerId: number,
    public readonly cycleNumber: number,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly durationDays: number,
    public readonly billingDate: Date,
    public readonly dueDate: Date,
    public readonly amount: number,
    public readonly paidAmount: number,
    public readonly currency: string,
    public readonly status: BillingCycleStatus,
    public readonly paymentStatus: BillingCyclePaymentStatus,
    public readonly paymentDate: Date | null,
    public readonly paymentMethod: string | null,
    public readonly invoiceId: string | null,
    public readonly invoiceNumber: string | null,
    public readonly invoiceStatus: BillingCycleInvoiceStatus | null,
    public readonly discountApplied: number | null,
    public readonly totalAmount: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo ciclo de facturación
   */
  static create(
    subscriptionId: number,
    partnerId: number,
    cycleNumber: number,
    startDate: Date,
    endDate: Date,
    billingDate: Date,
    dueDate: Date,
    amount: number,
    currency: string,
    durationDays: number,
    totalAmount: number,
    paidAmount: number = 0,
    status: BillingCycleStatus = 'pending',
    paymentStatus: BillingCyclePaymentStatus = 'pending',
    paymentDate: Date | null = null,
    paymentMethod: string | null = null,
    invoiceId: string | null = null,
    invoiceNumber: string | null = null,
    invoiceStatus: BillingCycleInvoiceStatus | null = null,
    discountApplied: number | null = null,
    id?: number,
  ): BillingCycle {
    const now = new Date();
    return new BillingCycle(
      id || 0,
      subscriptionId,
      partnerId,
      cycleNumber,
      startDate,
      endDate,
      durationDays,
      billingDate,
      dueDate,
      amount,
      paidAmount,
      currency,
      status,
      paymentStatus,
      paymentDate,
      paymentMethod,
      invoiceId,
      invoiceNumber,
      invoiceStatus,
      discountApplied,
      totalAmount,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si el ciclo está pagado completamente
   */
  isPaid(): boolean {
    return this.paymentStatus === 'paid' && this.paidAmount >= this.totalAmount;
  }

  /**
   * Método de dominio para verificar si el ciclo está vencido
   */
  isOverdue(): boolean {
    return this.dueDate < new Date() && !this.isPaid();
  }

  /**
   * Método de dominio para registrar un pago
   */
  recordPayment(amount: number, paymentMethod: string): BillingCycle {
    // Convertir ambos valores a Number para evitar concatenación de strings
    const paidAmountNum = Number(this.paidAmount);
    const amountNum = Number(amount);
    const totalAmountNum = Number(this.totalAmount);

    if (isNaN(paidAmountNum) || isNaN(amountNum) || isNaN(totalAmountNum)) {
      throw new Error(
        `Valores inválidos en recordPayment: paidAmount=${this.paidAmount}, amount=${amount}, totalAmount=${this.totalAmount}`,
      );
    }

    const newPaidAmount = paidAmountNum + amountNum;
    const isFullyPaid = newPaidAmount >= totalAmountNum;
    return new BillingCycle(
      this.id,
      this.subscriptionId,
      this.partnerId,
      this.cycleNumber,
      this.startDate,
      this.endDate,
      this.durationDays,
      this.billingDate,
      this.dueDate,
      this.amount,
      newPaidAmount,
      this.currency,
      isFullyPaid ? 'paid' : this.status,
      isFullyPaid ? ('paid' as BillingCyclePaymentStatus) : ('pending' as BillingCyclePaymentStatus),
      new Date(),
      paymentMethod,
      this.invoiceId,
      this.invoiceNumber,
      isFullyPaid ? 'paid' : this.invoiceStatus,
      this.discountApplied,
      this.totalAmount,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para revertir un pago
   * Se usa cuando se elimina un payment asociado
   */
  reversePayment(amount: number): BillingCycle {
    // Convertir ambos valores a Number para evitar concatenación de strings
    const paidAmountNum = Number(this.paidAmount);
    const amountNum = Number(amount);
    const totalAmountNum = Number(this.totalAmount);

    if (isNaN(paidAmountNum) || isNaN(amountNum) || isNaN(totalAmountNum)) {
      throw new Error(
        `Valores inválidos en reversePayment: paidAmount=${this.paidAmount}, amount=${amount}, totalAmount=${this.totalAmount}`,
      );
    }

    const newPaidAmount = Math.max(0, paidAmountNum - amountNum);
    const isFullyPaid = newPaidAmount >= totalAmountNum;
    return new BillingCycle(
      this.id,
      this.subscriptionId,
      this.partnerId,
      this.cycleNumber,
      this.startDate,
      this.endDate,
      this.durationDays,
      this.billingDate,
      this.dueDate,
      this.amount,
      newPaidAmount,
      this.currency,
      isFullyPaid ? 'paid' : 'pending',
      isFullyPaid ? ('paid' as BillingCyclePaymentStatus) : ('pending' as BillingCyclePaymentStatus),
      newPaidAmount > 0 ? this.paymentDate : null,
      newPaidAmount > 0 ? this.paymentMethod : null,
      this.invoiceId,
      this.invoiceNumber,
      isFullyPaid ? 'paid' : 'pending',
      this.discountApplied,
      this.totalAmount,
      this.createdAt,
      new Date(),
    );
  }
}

