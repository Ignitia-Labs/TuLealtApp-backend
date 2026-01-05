import { ApiProperty } from '@nestjs/swagger';
import { InvoiceItemResponse } from '../create-invoice/create-invoice.response';

/**
 * DTO de response para obtener una factura
 */
export class GetInvoiceResponse {
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

  @ApiProperty({
    description: 'Días hasta el vencimiento (negativo si está vencida)',
    example: 5,
    type: Number,
    nullable: true,
  })
  daysUntilDue: number | null;

  @ApiProperty({
    description: 'Indica si la factura está vencida',
    example: false,
    type: Boolean,
  })
  isOverdue: boolean;

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
    daysUntilDue?: number | null,
    isOverdue?: boolean,
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

    // Calcular días hasta vencimiento e isOverdue
    if (status === 'pending' || status === 'overdue') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);
      const diffTime = due.getTime() - today.getTime();
      this.daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.isOverdue = this.daysUntilDue < 0;
    } else {
      this.daysUntilDue = null;
      this.isOverdue = false;
    }
  }
}
