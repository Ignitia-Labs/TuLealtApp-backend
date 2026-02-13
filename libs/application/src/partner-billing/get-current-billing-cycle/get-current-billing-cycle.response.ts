import { ApiProperty } from '@nestjs/swagger';
import { BillingCycleStatus, BillingCyclePaymentStatus } from '@libs/domain';

/**
 * Response DTO para el ciclo de facturación actual del partner
 */
export class GetCurrentBillingCycleResponse {
  @ApiProperty({ description: 'ID del ciclo de facturación', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID de la suscripción', example: 1 })
  subscriptionId: number;

  @ApiProperty({ description: 'ID del partner', example: 1 })
  partnerId: number;

  @ApiProperty({ description: 'Número del ciclo', example: 5 })
  cycleNumber: number;

  @ApiProperty({ description: 'Fecha de inicio del ciclo', example: '2024-02-01T00:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ description: 'Fecha de fin del ciclo', example: '2024-02-29T23:59:59.999Z' })
  endDate: Date;

  @ApiProperty({ description: 'Duración en días', example: 30 })
  durationDays: number;

  @ApiProperty({ description: 'Fecha de facturación', example: '2024-03-01T00:00:00.000Z' })
  billingDate: Date;

  @ApiProperty({ description: 'Fecha de vencimiento', example: '2024-03-08T23:59:59.999Z' })
  dueDate: Date;

  @ApiProperty({ description: 'Monto base', example: 99.99 })
  amount: number;

  @ApiProperty({ description: 'Monto pagado', example: 50.0 })
  paidAmount: number;

  @ApiProperty({ description: 'Monto total (después de descuentos)', example: 89.99 })
  totalAmount: number;

  @ApiProperty({ description: 'Código de moneda', example: 'USD' })
  currency: string;

  @ApiProperty({ description: 'ID de la moneda', example: 1, nullable: true })
  currencyId: number | null;

  @ApiProperty({ description: 'Nombre de la moneda', example: 'US Dollar', nullable: true })
  currencyLabel: string | null;

  @ApiProperty({
    description: 'Estado del ciclo',
    example: 'pending',
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
  })
  status: BillingCycleStatus;

  @ApiProperty({
    description: 'Estado del pago',
    example: 'pending',
    enum: ['pending', 'paid', 'failed', 'refunded'],
  })
  paymentStatus: BillingCyclePaymentStatus;

  @ApiProperty({
    description: 'Número de factura asociada',
    example: 'INV-2024-001',
    nullable: true,
  })
  invoiceNumber: string | null;

  @ApiProperty({ description: 'Días hasta la fecha de vencimiento', example: 7 })
  daysUntilDue: number;

  @ApiProperty({ description: 'Indica si el ciclo está vencido', example: false })
  isOverdue: boolean;

  @ApiProperty({ description: 'Descuento aplicado', example: 10.0, nullable: true })
  discountApplied: number | null;

  constructor(
    id: number,
    subscriptionId: number,
    partnerId: number,
    cycleNumber: number,
    startDate: Date,
    endDate: Date,
    durationDays: number,
    billingDate: Date,
    dueDate: Date,
    amount: number,
    paidAmount: number,
    totalAmount: number,
    currency: string,
    currencyId: number | null,
    currencyLabel: string | null,
    status: BillingCycleStatus,
    paymentStatus: BillingCyclePaymentStatus,
    invoiceNumber: string | null,
    daysUntilDue: number,
    isOverdue: boolean,
    discountApplied: number | null,
  ) {
    this.id = id;
    this.subscriptionId = subscriptionId;
    this.partnerId = partnerId;
    this.cycleNumber = cycleNumber;
    this.startDate = startDate;
    this.endDate = endDate;
    this.durationDays = durationDays;
    this.billingDate = billingDate;
    this.dueDate = dueDate;
    this.amount = amount;
    this.paidAmount = paidAmount;
    this.totalAmount = totalAmount;
    this.currency = currency;
    this.currencyId = currencyId;
    this.currencyLabel = currencyLabel;
    this.status = status;
    this.paymentStatus = paymentStatus;
    this.invoiceNumber = invoiceNumber;
    this.daysUntilDue = daysUntilDue;
    this.isOverdue = isOverdue;
    this.discountApplied = discountApplied;
  }
}
