import { ApiProperty } from '@nestjs/swagger';
import { InvoiceStatus, InvoicePaymentStatus } from '@libs/domain';

/**
 * DTO para un item de factura
 */
export class InvoiceItemDto {
  @ApiProperty({ description: 'ID del item', example: '1' })
  id: string;

  @ApiProperty({ description: 'Descripción', example: 'Suscripción conecta - monthly' })
  description: string;

  @ApiProperty({ description: 'Cantidad', example: 1 })
  quantity: number;

  @ApiProperty({ description: 'Precio unitario', example: 99.99 })
  unitPrice: number;

  @ApiProperty({ description: 'Monto (quantity * unitPrice)', example: 99.99 })
  amount: number;

  @ApiProperty({ description: 'Porcentaje de impuesto', example: 16.0 })
  taxRate: number;

  @ApiProperty({ description: 'Monto de impuesto', example: 16.0 })
  taxAmount: number;

  @ApiProperty({ description: 'Porcentaje de descuento', example: 10.0, nullable: true })
  discountPercent?: number;

  @ApiProperty({ description: 'Monto de descuento', example: 10.0, nullable: true })
  discountAmount?: number;

  @ApiProperty({ description: 'Total del item', example: 105.99 })
  total: number;
}

/**
 * DTO para una factura individual en el historial
 */
export class InvoiceDto {
  @ApiProperty({ description: 'ID de la factura', example: 1 })
  id: number;

  @ApiProperty({ description: 'Número de factura', example: 'INV-2024-001' })
  invoiceNumber: string;

  @ApiProperty({ description: 'ID de la suscripción', example: 1 })
  subscriptionId: number;

  @ApiProperty({ description: 'ID del partner', example: 1 })
  partnerId: number;

  @ApiProperty({
    description: 'ID del ciclo de facturación asociado',
    example: 1,
    nullable: true,
  })
  billingCycleId: number | null;

  @ApiProperty({ description: 'Nombre del negocio', example: 'Café Delicia S.A.' })
  businessName: string;

  @ApiProperty({ description: 'ID fiscal/NIT', example: '123456789' })
  taxId: string;

  @ApiProperty({ description: 'Dirección fiscal', example: 'Av. Principal 123, Ciudad' })
  fiscalAddress: string;

  @ApiProperty({ description: 'Email de facturación', example: 'billing@cafedelicia.com' })
  billingEmail: string;

  @ApiProperty({ description: 'Fecha de emisión', example: '2024-02-01T00:00:00.000Z' })
  issueDate: Date;

  @ApiProperty({ description: 'Fecha de vencimiento', example: '2024-02-08T23:59:59.999Z' })
  dueDate: Date;

  @ApiProperty({
    description: 'Fecha de pago',
    example: '2024-02-05T10:30:00.000Z',
    nullable: true,
  })
  paidDate: Date | null;

  @ApiProperty({ description: 'Subtotal', example: 99.99 })
  subtotal: number;

  @ApiProperty({ description: 'Descuento aplicado', example: 10.0 })
  discountAmount: number;

  @ApiProperty({ description: 'Impuestos', example: 16.0 })
  taxAmount: number;

  @ApiProperty({ description: 'Crédito aplicado', example: 5.0 })
  creditApplied: number;

  @ApiProperty({ description: 'Total', example: 100.99 })
  total: number;

  @ApiProperty({ description: 'Código de moneda', example: 'USD' })
  currency: string;

  @ApiProperty({ description: 'ID de la moneda', example: 1, nullable: true })
  currencyId: number | null;

  @ApiProperty({ description: 'Nombre de la moneda', example: 'US Dollar', nullable: true })
  currencyLabel: string | null;

  @ApiProperty({
    description: 'Estado de la factura',
    example: 'paid',
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
  })
  status: InvoiceStatus;

  @ApiProperty({
    description: 'Estado del pago',
    example: 'paid',
    enum: ['pending', 'paid', 'failed', 'refunded'],
  })
  paymentStatus: InvoicePaymentStatus;

  @ApiProperty({ description: 'URL del PDF', example: 'https://...', nullable: true })
  pdfUrl: string | null;

  @ApiProperty({ description: 'Items de la factura', type: [InvoiceItemDto] })
  items: InvoiceItemDto[];

  @ApiProperty({ description: 'Indica si la factura está vencida', example: false })
  isOverdue: boolean;

  @ApiProperty({
    description: 'Días de vencimiento (null si no está vencida)',
    example: null,
    nullable: true,
  })
  daysOverdue: number | null;

  @ApiProperty({ description: 'Fecha de creación', example: '2024-02-01T10:30:00.000Z' })
  createdAt: Date;
}

/**
 * Response DTO para el historial de facturas del partner
 */
export class GetPartnerInvoicesResponse {
  @ApiProperty({ description: 'Lista de facturas', type: [InvoiceDto] })
  invoices: InvoiceDto[];

  @ApiProperty({ description: 'Total de registros', example: 15 })
  total: number;

  @ApiProperty({
    description: 'Número de página actual (null cuando all=true)',
    example: 1,
    nullable: true,
  })
  page: number | null;

  @ApiProperty({
    description: 'Registros por página (null cuando all=true)',
    example: 10,
    nullable: true,
  })
  limit: number | null;

  @ApiProperty({
    description: 'Total de páginas (null cuando all=true)',
    example: 2,
    nullable: true,
  })
  totalPages: number | null;

  @ApiProperty({ description: 'Indica si hay página siguiente', example: true, required: false })
  hasNextPage?: boolean;

  @ApiProperty({ description: 'Indica si hay página anterior', example: false, required: false })
  hasPreviousPage?: boolean;

  constructor(
    invoices: InvoiceDto[],
    total: number,
    page: number | null,
    limit: number | null,
    totalPages: number | null,
    hasNextPage?: boolean,
    hasPreviousPage?: boolean,
  ) {
    this.invoices = invoices;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = totalPages;
    this.hasNextPage = hasNextPage;
    this.hasPreviousPage = hasPreviousPage;
  }
}
