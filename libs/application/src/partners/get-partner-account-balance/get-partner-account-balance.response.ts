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
  }
}

