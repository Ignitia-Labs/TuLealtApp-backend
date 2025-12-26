/**
 * Entidad de dominio Invoice
 * Representa una factura generada para un ciclo de facturación
 * No depende de frameworks ni librerías externas
 */
export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type InvoicePaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type InvoicePaymentMethod = 'credit_card' | 'bank_transfer' | 'cash' | 'other';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  discountPercent?: number;
  discountAmount?: number;
  total: number;
}

export class Invoice {
  constructor(
    public readonly id: number,
    public readonly invoiceNumber: string,
    public readonly subscriptionId: number,
    public readonly partnerId: number,
    public readonly billingCycleId: number | null,
    public readonly businessName: string,
    public readonly taxId: string,
    public readonly fiscalAddress: string,
    public readonly billingEmail: string,
    public readonly issueDate: Date,
    public readonly dueDate: Date,
    public readonly paidDate: Date | null,
    public readonly subtotal: number,
    public readonly discountAmount: number,
    public readonly taxAmount: number,
    public readonly creditApplied: number,
    public readonly total: number,
    public readonly currency: string,
    public readonly items: InvoiceItem[],
    public readonly status: InvoiceStatus,
    public readonly paymentStatus: InvoicePaymentStatus,
    public readonly paymentMethod: InvoicePaymentMethod | null,
    public readonly pdfUrl: string | null,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear una nueva factura
   */
  static create(
    invoiceNumber: string,
    subscriptionId: number,
    partnerId: number,
    businessName: string,
    taxId: string,
    fiscalAddress: string,
    billingEmail: string,
    issueDate: Date,
    dueDate: Date,
    subtotal: number,
    taxAmount: number,
    total: number,
    currency: string,
    items: InvoiceItem[],
    billingCycleId: number | null = null,
    discountAmount: number = 0,
    creditApplied: number = 0,
    paidDate: Date | null = null,
    status: InvoiceStatus = 'pending',
    paymentStatus: InvoicePaymentStatus = 'pending',
    paymentMethod: InvoicePaymentMethod | null = null,
    pdfUrl: string | null = null,
    notes: string | null = null,
    id?: number,
  ): Invoice {
    const now = new Date();
    return new Invoice(
      id || 0,
      invoiceNumber,
      subscriptionId,
      partnerId,
      billingCycleId,
      businessName,
      taxId,
      fiscalAddress,
      billingEmail,
      issueDate,
      dueDate,
      paidDate,
      subtotal,
      discountAmount,
      taxAmount,
      creditApplied,
      total,
      currency,
      items,
      status,
      paymentStatus,
      paymentMethod,
      pdfUrl,
      notes,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si la factura está pagada
   */
  isPaid(): boolean {
    return this.paymentStatus === 'paid' && this.status === 'paid';
  }

  /**
   * Método de dominio para verificar si la factura está vencida
   */
  isOverdue(): boolean {
    return this.dueDate < new Date() && !this.isPaid();
  }

  /**
   * Método de dominio para marcar la factura como pagada
   */
  markAsPaid(paymentMethod: InvoicePaymentMethod, paidDate: Date = new Date()): Invoice {
    return new Invoice(
      this.id,
      this.invoiceNumber,
      this.subscriptionId,
      this.partnerId,
      this.billingCycleId,
      this.businessName,
      this.taxId,
      this.fiscalAddress,
      this.billingEmail,
      this.issueDate,
      this.dueDate,
      paidDate,
      this.subtotal,
      this.discountAmount,
      this.taxAmount,
      this.creditApplied,
      this.total,
      this.currency,
      this.items,
      'paid',
      'paid',
      paymentMethod,
      this.pdfUrl,
      this.notes,
      this.createdAt,
      new Date(),
    );
  }
}

