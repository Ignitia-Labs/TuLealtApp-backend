import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para payment aplicado a un billing cycle
 */
export class BillingCyclePaymentDto {
  @ApiProperty({
    description: 'ID del payment',
    example: 6,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Monto del payment aplicado',
    example: 164.92,
    type: Number,
  })
  amount: number;

  @ApiProperty({
    description: 'Moneda',
    example: 'GTQ',
    type: String,
  })
  currency: string;

  @ApiProperty({
    description: 'Método de pago',
    example: 'bank_transfer',
    enum: ['credit_card', 'bank_transfer', 'cash', 'other'],
  })
  paymentMethod: 'credit_card' | 'bank_transfer' | 'cash' | 'other';

  @ApiProperty({
    description: 'Fecha del pago',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  paymentDate: Date;

  @ApiProperty({
    description: 'ID del payment original del cual este es derivado (null si es original)',
    example: 2,
    type: Number,
    nullable: true,
  })
  originalPaymentId: number | null;

  @ApiProperty({
    description: 'Indica si este es un payment derivado',
    example: true,
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
    description: 'Notas del pago',
    example: 'Aplicado desde pago 2 (164.92 de 165)',
    type: String,
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;
}

/**
 * DTO de response para obtener payments de un billing cycle
 */
export class GetBillingCyclePaymentsResponse {
  @ApiProperty({
    description: 'ID del billing cycle',
    example: 7,
    type: Number,
  })
  billingCycleId: number;

  @ApiProperty({
    description: 'Número del ciclo',
    example: 1,
    type: Number,
  })
  cycleNumber: number;

  @ApiProperty({
    description: 'Monto total del ciclo',
    example: 164.92,
    type: Number,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Monto pagado hasta el momento',
    example: 164.92,
    type: Number,
  })
  paidAmount: number;

  @ApiProperty({
    description: 'Monto pendiente',
    example: 0,
    type: Number,
  })
  remainingAmount: number;

  @ApiProperty({
    description: 'Moneda',
    example: 'GTQ',
    type: String,
  })
  currency: string;

  @ApiProperty({
    description: 'Lista de payments aplicados a este billing cycle',
    type: BillingCyclePaymentDto,
    isArray: true,
  })
  payments: BillingCyclePaymentDto[];

  @ApiProperty({
    description: 'Total de payments aplicados',
    example: 1,
    type: Number,
  })
  totalPayments: number;

  constructor(
    billingCycleId: number,
    cycleNumber: number,
    totalAmount: number,
    paidAmount: number,
    remainingAmount: number,
    currency: string,
    payments: BillingCyclePaymentDto[],
  ) {
    this.billingCycleId = billingCycleId;
    this.cycleNumber = cycleNumber;
    this.totalAmount = totalAmount;
    this.paidAmount = paidAmount;
    this.remainingAmount = remainingAmount;
    this.currency = currency;
    this.payments = payments;
    this.totalPayments = payments.length;
  }
}

