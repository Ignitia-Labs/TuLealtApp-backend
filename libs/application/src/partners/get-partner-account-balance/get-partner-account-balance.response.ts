import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para resumen de factura pendiente
 */
export class InvoiceSummary {
  @ApiProperty({
    description: 'ID de la factura',
    example: 5,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Número de factura',
    example: 'INV-2024-005',
    type: String,
  })
  invoiceNumber: string;

  @ApiProperty({
    description: 'Total de la factura',
    example: 200.0,
    type: Number,
  })
  total: number;

  @ApiProperty({
    description: 'Fecha de vencimiento',
    example: '2024-02-15T00:00:00.000Z',
    type: Date,
  })
  dueDate: Date;

  @ApiProperty({
    description: 'Estado de la factura',
    example: 'pending',
    type: String,
  })
  status: string;
}

/**
 * DTO para resumen de pago reciente
 */
export class PaymentSummary {
  @ApiProperty({
    description: 'ID del pago',
    example: 10,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Monto del pago',
    example: 99.99,
    type: Number,
  })
  amount: number;

  @ApiProperty({
    description: 'Fecha del pago',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  paymentDate: Date;

  @ApiProperty({
    description: 'Estado del pago',
    example: 'paid',
    type: String,
  })
  status: string;

  @ApiProperty({
    description: 'ID del payment original del cual este es derivado (null si es original)',
    example: null,
    type: Number,
    nullable: true,
  })
  originalPaymentId: number | null;

  @ApiProperty({
    description: 'Indica si este es un payment derivado',
    example: false,
    type: Boolean,
  })
  isDerived: boolean;

  @ApiProperty({
    description: 'Referencia del pago',
    example: 'TAC1231231231',
    type: String,
    nullable: true,
  })
  reference: string | null;

  @ApiProperty({
    description: 'Monto total aplicado de este payment',
    example: 164.92,
    type: Number,
    required: false,
  })
  appliedAmount?: number;

  @ApiProperty({
    description: 'Monto restante sin aplicar de este payment',
    example: 0.08,
    type: Number,
    required: false,
  })
  remainingAmount?: number;

  @ApiProperty({
    description: 'Indica si el payment está completamente aplicado',
    example: true,
    type: Boolean,
    required: false,
  })
  isFullyApplied?: boolean;
}

/**
 * DTO para ciclos con pagos parciales
 */
export class PartiallyPaidCycleSummary {
  @ApiProperty({
    description: 'ID del ciclo de facturación',
    example: 3,
    type: Number,
  })
  cycleId: number;

  @ApiProperty({
    description: 'Número del ciclo',
    example: 2,
    type: Number,
  })
  cycleNumber: number;

  @ApiProperty({
    description: 'Monto total del ciclo',
    example: 100.0,
    type: Number,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Monto pagado del ciclo',
    example: 50.0,
    type: Number,
  })
  paidAmount: number;

  @ApiProperty({
    description: 'Monto restante por pagar',
    example: 50.0,
    type: Number,
  })
  remainingAmount: number;

  @ApiProperty({
    description: 'Porcentaje pagado',
    example: 50,
    type: Number,
  })
  percentagePaid: number;

  @ApiProperty({
    description: 'Fecha de vencimiento',
    example: '2026-02-28T00:00:00.000Z',
    type: Date,
  })
  dueDate: Date;

  @ApiProperty({
    description: 'Pagos aplicados a este ciclo',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 126 },
        amount: { type: 'number', example: 50.0 },
        paymentDate: { type: 'string', format: 'date-time' },
        reference: { type: 'string', nullable: true },
      },
    },
  })
  payments: Array<{
    id: number;
    amount: number;
    paymentDate: Date;
    reference: string | null;
  }>;
}

/**
 * DTO de response para obtener el estado de cuenta del partner
 */
export class GetPartnerAccountBalanceResponse {
  @ApiProperty({
    description: 'ID del partner',
    example: 1,
    type: Number,
  })
  partnerId: number;

  @ApiProperty({
    description: 'Total pagado por el partner',
    example: 500.0,
    type: Number,
  })
  totalPaid: number;

  @ApiProperty({
    description: 'Total pendiente de pago',
    example: 200.0,
    type: Number,
  })
  totalPending: number;

  @ApiProperty({
    description: 'Crédito disponible en la suscripción',
    example: 50.0,
    type: Number,
  })
  creditBalance: number;

  @ApiProperty({
    description: 'Saldo pendiente después de aplicar créditos',
    example: 150.0,
    type: Number,
  })
  outstandingBalance: number;

  @ApiProperty({
    description: 'Crédito disponible después de pagar facturas pendientes',
    example: 0.0,
    type: Number,
  })
  availableCredit: number;

  @ApiProperty({
    description: 'Moneda',
    example: 'USD',
    type: String,
  })
  currency: string;

  @ApiProperty({
    description: 'Fecha del último pago',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
    nullable: true,
  })
  lastPaymentDate: Date | null;

  @ApiProperty({
    description: 'Monto del último pago',
    example: 99.99,
    type: Number,
    nullable: true,
  })
  lastPaymentAmount: number | null;

  @ApiProperty({
    description: 'Lista de facturas pendientes (máximo 10)',
    type: InvoiceSummary,
    isArray: true,
  })
  pendingInvoices: InvoiceSummary[];

  @ApiProperty({
    description: 'Lista de pagos recientes (máximo 10)',
    type: PaymentSummary,
    isArray: true,
  })
  recentPayments: PaymentSummary[];

  @ApiProperty({
    description: 'Total de pagos pendientes de validación',
    example: 150.0,
    type: Number,
  })
  totalPendingValidation: number;

  @ApiProperty({
    description: 'Total de pagos rechazados',
    example: 50.0,
    type: Number,
  })
  totalRejected: number;

  @ApiProperty({
    description: 'Lista de pagos pendientes de validación (máximo 10)',
    type: PaymentSummary,
    isArray: true,
  })
  pendingValidationPayments: PaymentSummary[];

  @ApiProperty({
    description: 'Lista de pagos rechazados (máximo 10)',
    type: PaymentSummary,
    isArray: true,
  })
  rejectedPayments: PaymentSummary[];

  @ApiProperty({
    description: 'Lista de ciclos con pagos parciales (máximo 5)',
    type: PartiallyPaidCycleSummary,
    isArray: true,
  })
  partiallyPaidCycles: PartiallyPaidCycleSummary[];

  constructor(
    partnerId: number,
    totalPaid: number,
    totalPending: number,
    creditBalance: number,
    outstandingBalance: number,
    availableCredit: number,
    currency: string,
    lastPaymentDate: Date | null,
    lastPaymentAmount: number | null,
    pendingInvoices: InvoiceSummary[],
    recentPayments: PaymentSummary[],
    totalPendingValidation: number,
    totalRejected: number,
    pendingValidationPayments: PaymentSummary[],
    rejectedPayments: PaymentSummary[],
    partiallyPaidCycles: PartiallyPaidCycleSummary[],
  ) {
    this.partnerId = partnerId;
    this.totalPaid = totalPaid;
    this.totalPending = totalPending;
    this.creditBalance = creditBalance;
    this.outstandingBalance = outstandingBalance;
    this.availableCredit = availableCredit;
    this.currency = currency;
    this.lastPaymentDate = lastPaymentDate;
    this.lastPaymentAmount = lastPaymentAmount;
    this.pendingInvoices = pendingInvoices;
    this.recentPayments = recentPayments;
    this.totalPendingValidation = totalPendingValidation;
    this.totalRejected = totalRejected;
    this.pendingValidationPayments = pendingValidationPayments;
    this.rejectedPayments = rejectedPayments;
    this.partiallyPaidCycles = partiallyPaidCycles;
  }
}
