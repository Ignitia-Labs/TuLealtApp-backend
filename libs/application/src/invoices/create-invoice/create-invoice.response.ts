import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para un item de factura en la respuesta
 */
export class InvoiceItemResponse {
  @ApiProperty({
    description: 'ID único del item dentro de la factura',
    example: '1',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Descripción del item',
    example: 'Suscripción conecta - monthly',
    type: String,
  })
  description: string;

  @ApiProperty({
    description: 'Cantidad',
    example: 1,
    type: Number,
  })
  quantity: number;

  @ApiProperty({
    description: 'Precio unitario',
    example: 99.99,
    type: Number,
  })
  unitPrice: number;

  @ApiProperty({
    description: 'Monto del item (quantity * unitPrice)',
    example: 99.99,
    type: Number,
  })
  amount: number;

  @ApiProperty({
    description: 'Porcentaje de impuesto',
    example: 16.0,
    type: Number,
  })
  taxRate: number;

  @ApiProperty({
    description: 'Monto de impuesto',
    example: 16.0,
    type: Number,
  })
  taxAmount: number;

  @ApiProperty({
    description: 'Porcentaje de descuento',
    example: 10.0,
    type: Number,
    nullable: true,
  })
  discountPercent?: number;

  @ApiProperty({
    description: 'Monto de descuento',
    example: 10.0,
    type: Number,
    nullable: true,
  })
  discountAmount?: number;

  @ApiProperty({
    description: 'Total del item (amount + tax - discount)',
    example: 105.99,
    type: Number,
  })
  total: number;

  constructor(
    id: string,
    description: string,
    quantity: number,
    unitPrice: number,
    amount: number,
    taxRate: number,
    taxAmount: number,
    discountPercent?: number,
    discountAmount?: number,
    total?: number,
  ) {
    this.id = id;
    this.description = description;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
    this.amount = amount;
    this.taxRate = taxRate;
    this.taxAmount = taxAmount;
    this.discountPercent = discountPercent;
    this.discountAmount = discountAmount;
    this.total = total ?? amount + taxAmount - (discountAmount ?? 0);
  }
}

/**
 * DTO de response para crear una factura
 */
export class CreateInvoiceResponse {
  @ApiProperty({
    description: 'ID único de la factura',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Número único de factura',
    example: 'INV-2024-001',
    type: String,
  })
  invoiceNumber: string;

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
    description: 'ID del ciclo de facturación asociado',
    example: 1,
    type: Number,
    nullable: true,
  })
  billingCycleId: number | null;

  @ApiProperty({
    description: 'Nombre del negocio',
    example: 'Café Delicia S.A.',
    type: String,
  })
  businessName: string;

  @ApiProperty({
    description: 'NIT/RFC/Tax ID',
    example: '123456789',
    type: String,
  })
  taxId: string;

  @ApiProperty({
    description: 'Dirección fiscal',
    example: 'Av. Principal 123, Ciudad',
    type: String,
  })
  fiscalAddress: string;

  @ApiProperty({
    description: 'Email de facturación',
    example: 'billing@cafedelicia.com',
    type: String,
  })
  billingEmail: string;

  @ApiProperty({
    description: 'Fecha de emisión',
    example: '2024-02-01T00:00:00.000Z',
    type: Date,
  })
  issueDate: Date;

  @ApiProperty({
    description: 'Fecha límite de pago',
    example: '2024-02-08T23:59:59.999Z',
    type: Date,
  })
  dueDate: Date;

  @ApiProperty({
    description: 'Fecha de pago (si aplica)',
    example: null,
    type: Date,
    nullable: true,
  })
  paidDate: Date | null;

  @ApiProperty({
    description: 'Subtotal sin impuestos',
    example: 99.99,
    type: Number,
  })
  subtotal: number;

  @ApiProperty({
    description: 'Descuento aplicado',
    example: 10.0,
    type: Number,
  })
  discountAmount: number;

  @ApiProperty({
    description: 'Impuestos',
    example: 16.0,
    type: Number,
  })
  taxAmount: number;

  @ApiProperty({
    description: 'Créditos aplicados',
    example: 0,
    type: Number,
  })
  creditApplied: number;

  @ApiProperty({
    description: 'Total a pagar',
    example: 105.99,
    type: Number,
  })
  total: number;

  @ApiProperty({
    description: 'Moneda',
    example: 'USD',
    type: String,
  })
  currency: string;

  @ApiProperty({
    description: 'Items de la factura',
    type: InvoiceItemResponse,
    isArray: true,
  })
  items: InvoiceItemResponse[];

  @ApiProperty({
    description: 'Estado de la factura',
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
    description: 'Método de pago',
    example: null,
    enum: ['credit_card', 'bank_transfer', 'cash', 'other'],
    nullable: true,
  })
  paymentMethod: 'credit_card' | 'bank_transfer' | 'cash' | 'other' | null;

  @ApiProperty({
    description: 'URL del PDF generado',
    example: null,
    type: String,
    nullable: true,
  })
  pdfUrl: string | null;

  @ApiProperty({
    description: 'Notas adicionales',
    example: 'Factura generada automáticamente',
    type: String,
    nullable: true,
  })
  notes: string | null;

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
    invoiceNumber: string,
    subscriptionId: number,
    partnerId: number,
    billingCycleId: number | null,
    businessName: string,
    taxId: string,
    fiscalAddress: string,
    billingEmail: string,
    issueDate: Date,
    dueDate: Date,
    paidDate: Date | null,
    subtotal: number,
    discountAmount: number,
    taxAmount: number,
    creditApplied: number,
    total: number,
    currency: string,
    items: InvoiceItemResponse[],
    status: 'pending' | 'paid' | 'overdue' | 'cancelled',
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded',
    paymentMethod: 'credit_card' | 'bank_transfer' | 'cash' | 'other' | null,
    pdfUrl: string | null,
    notes: string | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.invoiceNumber = invoiceNumber;
    this.subscriptionId = subscriptionId;
    this.partnerId = partnerId;
    this.billingCycleId = billingCycleId;
    this.businessName = businessName;
    this.taxId = taxId;
    this.fiscalAddress = fiscalAddress;
    this.billingEmail = billingEmail;
    this.issueDate = issueDate;
    this.dueDate = dueDate;
    this.paidDate = paidDate;
    this.subtotal = subtotal;
    this.discountAmount = discountAmount;
    this.taxAmount = taxAmount;
    this.creditApplied = creditApplied;
    this.total = total;
    this.currency = currency;
    this.items = items;
    this.status = status;
    this.paymentStatus = paymentStatus;
    this.paymentMethod = paymentMethod;
    this.pdfUrl = pdfUrl;
    this.notes = notes;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

