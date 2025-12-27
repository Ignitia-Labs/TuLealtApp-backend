import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para obtener una suscripción
 */
export class GetSubscriptionResponse {
  @ApiProperty({
    description: 'ID de la suscripción',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID del partner',
    example: 1,
    type: Number,
  })
  partnerId: number;

  @ApiProperty({
    description: 'ID numérico del plan de precios',
    example: 1,
    type: Number,
  })
  planId: number;

  @ApiProperty({
    description: 'Slug del plan de precios',
    example: 'conecta',
    type: String,
  })
  planSlug: string;

  @ApiProperty({
    description: 'Tipo de plan',
    example: 'conecta',
    type: String,
  })
  planType: string;

  @ApiProperty({
    description: 'Estado de la suscripción',
    example: 'active',
    type: String,
  })
  status: string;

  @ApiProperty({
    description: 'Fecha de inicio',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  startDate: Date;

  @ApiProperty({
    description: 'Fecha de renovación',
    example: '2025-01-01T00:00:00.000Z',
    type: Date,
  })
  renewalDate: Date;

  @ApiProperty({
    description: 'Frecuencia de facturación',
    example: 'monthly',
    type: String,
  })
  billingFrequency: string;

  @ApiProperty({
    description: 'Monto de facturación',
    example: 79.99,
    type: Number,
  })
  billingAmount: number;

  @ApiProperty({
    description: 'Moneda',
    example: 'USD',
    type: String,
  })
  currency: string;

  @ApiProperty({
    description: 'Fecha del próximo pago',
    example: '2024-02-01T00:00:00.000Z',
    type: Date,
  })
  nextBillingDate: Date;

  @ApiProperty({
    description: 'Monto del próximo pago',
    example: 79.99,
    type: Number,
  })
  nextBillingAmount: number;

  @ApiProperty({
    description: 'Inicio del período actual',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  currentPeriodStart: Date;

  @ApiProperty({
    description: 'Fin del período actual',
    example: '2024-02-01T00:00:00.000Z',
    type: Date,
  })
  currentPeriodEnd: Date;

  @ApiProperty({
    description: 'Fecha de fin del período de prueba',
    example: '2024-01-15T00:00:00.000Z',
    type: Date,
    nullable: true,
  })
  trialEndDate: Date | null;

  @ApiProperty({
    description: 'Fecha de pausa',
    example: null,
    type: Date,
    nullable: true,
  })
  pausedAt: Date | null;

  @ApiProperty({
    description: 'Razón de la pausa',
    example: null,
    type: String,
    nullable: true,
  })
  pauseReason: string | null;

  @ApiProperty({
    description: 'Días de gracia',
    example: 7,
    type: Number,
  })
  gracePeriodDays: number;

  @ApiProperty({
    description: 'Intentos de reintento',
    example: 0,
    type: Number,
  })
  retryAttempts: number;

  @ApiProperty({
    description: 'Máximo intentos de reintento',
    example: 3,
    type: Number,
  })
  maxRetryAttempts: number;

  @ApiProperty({
    description: 'Saldo de crédito',
    example: 0,
    type: Number,
  })
  creditBalance: number;

  @ApiProperty({
    description: 'Porcentaje de descuento',
    example: null,
    type: Number,
    nullable: true,
  })
  discountPercent: number | null;

  @ApiProperty({
    description: 'Código de descuento',
    example: null,
    type: String,
    nullable: true,
  })
  discountCode: string | null;

  @ApiProperty({
    description: 'Fecha del último pago',
    example: null,
    type: Date,
    nullable: true,
  })
  lastPaymentDate: Date | null;

  @ApiProperty({
    description: 'Monto del último pago',
    example: null,
    type: Number,
    nullable: true,
  })
  lastPaymentAmount: number | null;

  @ApiProperty({
    description: 'Estado del pago',
    example: null,
    type: String,
    nullable: true,
  })
  paymentStatus: string | null;

  @ApiProperty({
    description: 'Renovación automática',
    example: true,
    type: Boolean,
  })
  autoRenew: boolean;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de actualización',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(
    id: number,
    partnerId: number,
    planId: number,
    planSlug: string,
    planType: string,
    status: string,
    startDate: Date,
    renewalDate: Date,
    billingFrequency: string,
    billingAmount: number,
    currency: string,
    nextBillingDate: Date,
    nextBillingAmount: number,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    trialEndDate: Date | null,
    pausedAt: Date | null,
    pauseReason: string | null,
    gracePeriodDays: number,
    retryAttempts: number,
    maxRetryAttempts: number,
    creditBalance: number,
    discountPercent: number | null,
    discountCode: string | null,
    lastPaymentDate: Date | null,
    lastPaymentAmount: number | null,
    paymentStatus: string | null,
    autoRenew: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.partnerId = partnerId;
    this.planId = planId;
    this.planSlug = planSlug;
    this.planType = planType;
    this.status = status;
    this.startDate = startDate;
    this.renewalDate = renewalDate;
    this.billingFrequency = billingFrequency;
    this.billingAmount = billingAmount;
    this.currency = currency;
    this.nextBillingDate = nextBillingDate;
    this.nextBillingAmount = nextBillingAmount;
    this.currentPeriodStart = currentPeriodStart;
    this.currentPeriodEnd = currentPeriodEnd;
    this.trialEndDate = trialEndDate;
    this.pausedAt = pausedAt;
    this.pauseReason = pauseReason;
    this.gracePeriodDays = gracePeriodDays;
    this.retryAttempts = retryAttempts;
    this.maxRetryAttempts = maxRetryAttempts;
    this.creditBalance = creditBalance;
    this.discountPercent = discountPercent;
    this.discountCode = discountCode;
    this.lastPaymentDate = lastPaymentDate;
    this.lastPaymentAmount = lastPaymentAmount;
    this.paymentStatus = paymentStatus;
    this.autoRenew = autoRenew;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

