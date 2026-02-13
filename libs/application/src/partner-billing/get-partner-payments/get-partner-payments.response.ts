import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus, PaymentMethod } from '@libs/domain';

/**
 * DTO para un pago individual en el historial
 */
export class PaymentDto {
  @ApiProperty({ description: 'ID del pago', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID de la suscripción', example: 1 })
  subscriptionId: number;

  @ApiProperty({ description: 'ID del partner', example: 1 })
  partnerId: number;

  @ApiProperty({ description: 'Monto del pago', example: 99.99 })
  amount: number;

  @ApiProperty({ description: 'Código de moneda', example: 'USD' })
  currency: string;

  @ApiProperty({ description: 'ID de la moneda', example: 1, nullable: true })
  currencyId: number | null;

  @ApiProperty({ description: 'Nombre de la moneda', example: 'US Dollar', nullable: true })
  currencyLabel: string | null;

  @ApiProperty({
    description: 'Método de pago',
    example: 'credit_card',
    enum: ['credit_card', 'bank_transfer', 'cash', 'other'],
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Estado del pago',
    example: 'paid',
    enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
  })
  status: PaymentStatus;

  @ApiProperty({ description: 'Fecha del pago', example: '2024-02-05T10:30:00.000Z' })
  paymentDate: Date;

  @ApiProperty({
    description: 'Fecha de procesamiento',
    example: '2024-02-05T10:30:05.000Z',
    nullable: true,
  })
  processedDate: Date | null;

  @ApiProperty({
    description: 'Número de factura asociada',
    example: 'INV-2024-001',
    nullable: true,
  })
  invoiceNumber: string | null;

  @ApiProperty({
    description: 'ID del ciclo de facturación asociado',
    example: 1,
    nullable: true,
  })
  billingCycleId: number | null;

  @ApiProperty({ description: 'Referencia del pago', example: 'REF-2024-001', nullable: true })
  reference: string | null;

  @ApiProperty({
    description: 'Código de confirmación',
    example: 'CONF-123456',
    nullable: true,
  })
  confirmationCode: string | null;

  @ApiProperty({ description: 'Gateway de pago utilizado', example: 'stripe', nullable: true })
  gateway: string | null;

  @ApiProperty({
    description: 'ID de transacción del gateway',
    example: 'ch_1234567890',
    nullable: true,
  })
  gatewayTransactionId: string | null;

  @ApiProperty({
    description: 'Últimos 4 dígitos de la tarjeta',
    example: '4242',
    nullable: true,
  })
  cardLastFour: string | null;

  @ApiProperty({ description: 'Marca de la tarjeta', example: 'Visa', nullable: true })
  cardBrand: string | null;

  @ApiProperty({ description: 'Fecha de creación', example: '2024-02-05T10:30:00.000Z' })
  createdAt: Date;
}

/**
 * Response DTO para el historial de pagos del partner
 */
export class GetPartnerPaymentsResponse {
  @ApiProperty({ description: 'Lista de pagos', type: [PaymentDto] })
  payments: PaymentDto[];

  @ApiProperty({ description: 'Total de registros', example: 25 })
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
    example: 3,
    nullable: true,
  })
  totalPages: number | null;

  @ApiProperty({ description: 'Indica si hay página siguiente', example: true, required: false })
  hasNextPage?: boolean;

  @ApiProperty({ description: 'Indica si hay página anterior', example: false, required: false })
  hasPreviousPage?: boolean;

  constructor(
    payments: PaymentDto[],
    total: number,
    page: number | null,
    limit: number | null,
    totalPages: number | null,
    hasNextPage?: boolean,
    hasPreviousPage?: boolean,
  ) {
    this.payments = payments;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = totalPages;
    this.hasNextPage = hasNextPage;
    this.hasPreviousPage = hasPreviousPage;
  }
}
