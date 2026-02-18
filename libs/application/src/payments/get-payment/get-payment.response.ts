import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para obtener un pago
 */
export class GetPaymentResponse {
  @ApiProperty({
    description: 'ID único del pago',
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
    description: 'ID de la factura asociada',
    example: 1,
    type: Number,
    nullable: true,
  })
  invoiceId: number | null;

  @ApiProperty({
    description: 'ID del ciclo de facturación asociado',
    example: 1,
    type: Number,
    nullable: true,
  })
  billingCycleId: number | null;

  @ApiProperty({
    description: 'Monto del pago',
    example: 99.99,
    type: Number,
  })
  amount: number;

  @ApiProperty({
    description: 'Moneda del pago',
    example: 'USD',
    type: String,
  })
  currency: string;

  @ApiProperty({
    description: 'Método de pago',
    example: 'credit_card',
    enum: ['credit_card', 'bank_transfer', 'cash', 'other'],
  })
  paymentMethod: 'credit_card' | 'bank_transfer' | 'cash' | 'other';

  @ApiProperty({
    description: 'Estado del pago',
    example: 'validated',
    enum: [
      'pending',
      'pending_validation',
      'validated',
      'rejected',
      'paid',
      'failed',
      'refunded',
      'cancelled',
    ],
  })
  status:
    | 'pending'
    | 'pending_validation'
    | 'validated'
    | 'rejected'
    | 'paid'
    | 'failed'
    | 'refunded'
    | 'cancelled';

  @ApiProperty({
    description: 'Fecha del pago',
    example: '2024-02-05T10:30:00.000Z',
    type: Date,
  })
  paymentDate: Date;

  @ApiProperty({
    description: 'Fecha de procesamiento',
    example: '2024-02-05T10:30:05.000Z',
    type: Date,
    nullable: true,
  })
  processedDate: Date | null;

  @ApiProperty({
    description: 'ID de transacción externa',
    example: 'txn_123456789',
    type: String,
    nullable: true,
  })
  transactionId: number | null;

  @ApiProperty({
    description: 'Referencia del pago',
    example: 'REF-2024-001',
    type: String,
    nullable: true,
  })
  reference: string | null;

  @ApiProperty({
    description: 'Código de confirmación',
    example: 'CONF-123456',
    type: String,
    nullable: true,
  })
  confirmationCode: string | null;

  @ApiProperty({
    description: 'Gateway de pago usado',
    example: 'stripe',
    type: String,
    nullable: true,
  })
  gateway: string | null;

  @ApiProperty({
    description: 'ID de transacción del gateway',
    example: 'ch_1234567890',
    type: String,
    nullable: true,
  })
  gatewayTransactionId: string | null;

  @ApiProperty({
    description: 'Últimos 4 dígitos de la tarjeta',
    example: '4242',
    type: String,
    nullable: true,
  })
  cardLastFour: string | null;

  @ApiProperty({
    description: 'Marca de la tarjeta',
    example: 'Visa',
    type: String,
    nullable: true,
  })
  cardBrand: string | null;

  @ApiProperty({
    description: 'Fecha de expiración de la tarjeta',
    example: '12/25',
    type: String,
    nullable: true,
  })
  cardExpiry: string | null;

  @ApiProperty({
    description: 'Indica si es un reintento de pago',
    example: false,
    type: Boolean,
  })
  isRetry: boolean;

  @ApiProperty({
    description: 'Número de intento de reintento',
    example: null,
    type: Number,
    nullable: true,
  })
  retryAttempt: number | null;

  @ApiProperty({
    description: 'Notas adicionales',
    example: 'Pago procesado exitosamente',
    type: String,
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'ID del usuario que procesó el pago',
    example: null,
    type: Number,
    nullable: true,
  })
  processedBy: number | null;

  @ApiProperty({
    description: 'URL de la imagen del comprobante de pago',
    example: 'https://cdn.example.com/payments/image.webp',
    type: String,
    nullable: true,
    required: false,
  })
  image: string | null;

  @ApiProperty({
    description: 'ID del pago original del cual este es derivado (null si es un pago original)',
    example: null,
    type: Number,
    nullable: true,
  })
  originalPaymentId: number | null;

  @ApiProperty({
    description: 'Indica si este es un pago derivado (creado automáticamente desde otro pago)',
    example: false,
    type: Boolean,
  })
  isDerived: boolean;

  @ApiProperty({
    description: 'Monto total aplicado de este payment (suma de todos los payments derivados)',
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

  @ApiProperty({
    description: 'Lista de aplicaciones de este payment (payments derivados)',
    type: Object,
    isArray: true,
  })
  applications?: Array<{
    id: number;
    amount: number;
    billingCycleId: number | null;
    invoiceId: number | null;
    createdAt: Date;
  }>;

  @ApiProperty({
    description: 'Resumen simplificado para UI: agrupa información de aplicación',
    type: Object,
  })
  summary?: {
    totalAmount: number;
    appliedAmount: number;
    remainingAmount: number;
    isFullyApplied: boolean;
    applicationsCount: number;
    appliedTo: Array<{
      type: 'billing_cycle' | 'invoice';
      id: number;
      amount: number;
    }>;
  };

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-02-05T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de actualización',
    example: '2024-02-05T10:30:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(
    id: number,
    subscriptionId: number,
    partnerId: number,
    invoiceId: number | null,
    billingCycleId: number | null,
    amount: number,
    currency: string,
    paymentMethod: 'credit_card' | 'bank_transfer' | 'cash' | 'other',
    status:
      | 'pending'
      | 'pending_validation'
      | 'validated'
      | 'rejected'
      | 'paid'
      | 'failed'
      | 'refunded'
      | 'cancelled',
    paymentDate: Date,
    processedDate: Date | null,
    transactionId: number | null,
    reference: string | null,
    confirmationCode: string | null,
    gateway: string | null,
    gatewayTransactionId: string | null,
    cardLastFour: string | null,
    cardBrand: string | null,
    cardExpiry: string | null,
    isRetry: boolean,
    retryAttempt: number | null,
    notes: string | null,
    processedBy: number | null,
    image: string | null,
    originalPaymentId: number | null,
    createdAt: Date,
    updatedAt: Date,
    appliedAmount?: number,
    remainingAmount?: number,
    isFullyApplied?: boolean,
    applications?: Array<{
      id: number;
      amount: number;
      billingCycleId: number | null;
      invoiceId: number | null;
      createdAt: Date;
    }>,
    summary?: {
      totalAmount: number;
      appliedAmount: number;
      remainingAmount: number;
      isFullyApplied: boolean;
      applicationsCount: number;
      appliedTo: Array<{
        type: 'billing_cycle' | 'invoice';
        id: number;
        amount: number;
      }>;
    },
  ) {
    this.id = id;
    this.subscriptionId = subscriptionId;
    this.partnerId = partnerId;
    this.invoiceId = invoiceId;
    this.billingCycleId = billingCycleId;
    this.amount = amount;
    this.currency = currency;
    this.paymentMethod = paymentMethod;
    this.status = status;
    this.paymentDate = paymentDate;
    this.processedDate = processedDate;
    this.transactionId = transactionId;
    this.reference = reference;
    this.confirmationCode = confirmationCode;
    this.gateway = gateway;
    this.gatewayTransactionId = gatewayTransactionId;
    this.cardLastFour = cardLastFour;
    this.cardBrand = cardBrand;
    this.cardExpiry = cardExpiry;
    this.isRetry = isRetry;
    this.retryAttempt = retryAttempt;
    this.notes = notes;
    this.processedBy = processedBy;
    this.image = image;
    this.originalPaymentId = originalPaymentId;
    this.isDerived = originalPaymentId !== null && originalPaymentId > 0;
    this.appliedAmount = appliedAmount;
    this.remainingAmount = remainingAmount;
    this.isFullyApplied = isFullyApplied;
    this.applications = applications;

    // Generar resumen simplificado para UI
    if (applications && applications.length > 0) {
      const appliedTo = applications.map((app) => ({
        type: (app.billingCycleId ? 'billing_cycle' : 'invoice') as 'billing_cycle' | 'invoice',
        id: app.billingCycleId || app.invoiceId || 0,
        amount: app.amount,
      }));

      this.summary = {
        totalAmount: amount,
        appliedAmount: appliedAmount || 0,
        remainingAmount: remainingAmount || 0,
        isFullyApplied: isFullyApplied || false,
        applicationsCount: applications.length,
        appliedTo,
      };
    }

    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
