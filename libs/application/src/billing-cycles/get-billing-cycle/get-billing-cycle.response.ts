import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para obtener un ciclo de facturación
 */
export class GetBillingCycleResponse {
  @ApiProperty({
    description: 'ID único del ciclo',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID de la suscripción asociada',
    example: 1,
    type: Number,
  })
  subscriptionId: number;

  @ApiProperty({
    description: 'ID del partner asociado',
    example: 1,
    type: Number,
  })
  partnerId: number;

  @ApiProperty({
    description: 'Número secuencial del ciclo',
    example: 1,
    type: Number,
  })
  cycleNumber: number;

  @ApiProperty({
    description: 'Fecha de inicio del período facturado',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  startDate: Date;

  @ApiProperty({
    description: 'Fecha de fin del período facturado',
    example: '2024-01-31T23:59:59.999Z',
    type: Date,
  })
  endDate: Date;

  @ApiProperty({
    description: 'Duración del ciclo en días',
    example: 31,
    type: Number,
  })
  durationDays: number;

  @ApiProperty({
    description: 'Fecha en que se genera la facturación',
    example: '2024-02-01T00:00:00.000Z',
    type: Date,
  })
  billingDate: Date;

  @ApiProperty({
    description: 'Fecha límite de pago',
    example: '2024-02-08T23:59:59.999Z',
    type: Date,
  })
  dueDate: Date;

  @ApiProperty({
    description: 'Monto base del ciclo',
    example: 99.99,
    type: Number,
  })
  amount: number;

  @ApiProperty({
    description: 'Monto pagado hasta el momento',
    example: 0,
    type: Number,
  })
  paidAmount: number;

  @ApiProperty({
    description: 'Monto total (incluye descuentos)',
    example: 89.99,
    type: Number,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Moneda del ciclo (código ISO)',
    example: 'USD',
    type: String,
  })
  currency: string;

  @ApiProperty({
    description: 'ID de la moneda en la base de datos',
    example: 1,
    type: Number,
    nullable: true,
  })
  currencyId: number | null;

  @ApiProperty({
    description: 'Nombre completo de la moneda',
    example: 'US Dollar',
    type: String,
    nullable: true,
  })
  currencyLabel: string | null;

  @ApiProperty({
    description: 'Estado del ciclo',
    example: 'pending',
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
  })
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';

  @ApiProperty({
    description: 'Estado del pago',
    example: 'pending',
    enum: ['pending', 'paid', 'failed', 'refunded'],
  })
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';

  @ApiProperty({
    description: 'Fecha de pago (si aplica)',
    example: null,
    type: Date,
    nullable: true,
  })
  paymentDate: Date | null;

  @ApiProperty({
    description: 'Método de pago (si aplica)',
    example: null,
    type: String,
    nullable: true,
  })
  paymentMethod: string | null;

  @ApiProperty({
    description: 'ID de la factura asociada (si aplica)',
    example: null,
    type: String,
    nullable: true,
  })
  invoiceId: string | null;

  @ApiProperty({
    description: 'Número de factura (si aplica)',
    example: null,
    type: String,
    nullable: true,
  })
  invoiceNumber: string | null;

  @ApiProperty({
    description: 'Estado de la factura (si aplica)',
    example: null,
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
    nullable: true,
  })
  invoiceStatus: 'pending' | 'paid' | 'overdue' | 'cancelled' | null;

  @ApiProperty({
    description: 'Descuento aplicado',
    example: 10.0,
    type: Number,
    nullable: true,
  })
  discountApplied: number | null;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-02-01T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de actualización',
    example: '2024-02-01T10:30:00.000Z',
    type: Date,
  })
  updatedAt: Date;

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
    status: 'pending' | 'paid' | 'overdue' | 'cancelled',
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded',
    paymentDate: Date | null,
    paymentMethod: string | null,
    invoiceId: string | null,
    invoiceNumber: string | null,
    invoiceStatus: 'pending' | 'paid' | 'overdue' | 'cancelled' | null,
    discountApplied: number | null,
    createdAt: Date,
    updatedAt: Date,
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
    this.paymentDate = paymentDate;
    this.paymentMethod = paymentMethod;
    this.invoiceId = invoiceId;
    this.invoiceNumber = invoiceNumber;
    this.invoiceStatus = invoiceStatus;
    this.discountApplied = discountApplied;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

