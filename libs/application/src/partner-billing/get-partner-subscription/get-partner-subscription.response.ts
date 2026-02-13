import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus, PlanType, BillingFrequency } from '@libs/domain';

/**
 * Response DTO para la información de la suscripción del partner
 */
export class GetPartnerSubscriptionResponse {
  @ApiProperty({ description: 'ID de la suscripción', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID del partner', example: 1 })
  partnerId: number;

  @ApiProperty({ description: 'ID del plan', example: 2 })
  planId: number;

  @ApiProperty({
    description: 'Tipo de plan',
    example: 'conecta',
    enum: ['esencia', 'conecta', 'inspira'],
  })
  planType: PlanType;

  @ApiProperty({
    description: 'Estado de la suscripción',
    example: 'active',
    enum: ['active', 'expired', 'suspended', 'cancelled', 'trialing', 'past_due', 'paused'],
  })
  status: SubscriptionStatus;

  @ApiProperty({
    description: 'Frecuencia de facturación',
    example: 'monthly',
    enum: ['monthly', 'quarterly', 'semiannual', 'annual'],
  })
  billingFrequency: BillingFrequency;

  @ApiProperty({ description: 'Monto de facturación base', example: 99.99 })
  billingAmount: number;

  @ApiProperty({ description: 'Precio base', example: 99.99 })
  basePrice: number;

  @ApiProperty({ description: 'Monto de impuestos', example: 16.0 })
  taxAmount: number;

  @ApiProperty({ description: 'Precio total (base + impuestos)', example: 115.99 })
  totalPrice: number;

  @ApiProperty({ description: 'Indica si incluye impuestos', example: true })
  includeTax: boolean;

  @ApiProperty({ description: 'Porcentaje de impuesto', example: 16.0, nullable: true })
  taxPercent: number | null;

  @ApiProperty({ description: 'Código de moneda', example: 'USD' })
  currency: string;

  @ApiProperty({ description: 'ID de la moneda', example: 1, nullable: true })
  currencyId: number | null;

  @ApiProperty({ description: 'Nombre de la moneda', example: 'US Dollar', nullable: true })
  currencyLabel: string | null;

  @ApiProperty({ description: 'Fecha de inicio', example: '2024-01-01T00:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ description: 'Fecha de renovación', example: '2025-01-01T00:00:00.000Z' })
  renewalDate: Date;

  @ApiProperty({
    description: 'Inicio del período actual',
    example: '2024-02-01T00:00:00.000Z',
  })
  currentPeriodStart: Date;

  @ApiProperty({
    description: 'Fin del período actual',
    example: '2024-02-29T23:59:59.999Z',
  })
  currentPeriodEnd: Date;

  @ApiProperty({
    description: 'Fecha de la próxima facturación',
    example: '2024-03-01T00:00:00.000Z',
  })
  nextBillingDate: Date;

  @ApiProperty({ description: 'Monto de la próxima facturación', example: 99.99 })
  nextBillingAmount: number;

  @ApiProperty({ description: 'Renovación automática', example: true })
  autoRenew: boolean;

  @ApiProperty({ description: 'Balance de crédito disponible', example: 25.5 })
  creditBalance: number;

  @ApiProperty({ description: 'Porcentaje de descuento', example: 10.0, nullable: true })
  discountPercent: number | null;

  @ApiProperty({ description: 'Código de descuento', example: 'PROMO2024', nullable: true })
  discountCode: string | null;

  @ApiProperty({
    description: 'Fecha del último pago',
    example: '2024-02-05T10:30:00.000Z',
    nullable: true,
  })
  lastPaymentDate: Date | null;

  @ApiProperty({ description: 'Monto del último pago', example: 99.99, nullable: true })
  lastPaymentAmount: number | null;

  @ApiProperty({ description: 'Estado del pago', example: 'paid', nullable: true })
  paymentStatus: 'paid' | 'pending' | 'failed' | null;

  @ApiProperty({
    description: 'Fecha de fin del período de prueba',
    example: null,
    nullable: true,
  })
  trialEndDate: Date | null;

  @ApiProperty({ description: 'Días de período de gracia', example: 7 })
  gracePeriodDays: number;

  @ApiProperty({ description: 'Días hasta la renovación', example: 25 })
  daysUntilRenewal: number;

  @ApiProperty({ description: 'Indica si está en período de gracia', example: false })
  isInGracePeriod: boolean;

  @ApiProperty({ description: 'Fecha de creación', example: '2024-01-01T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización', example: '2024-02-05T10:30:00.000Z' })
  updatedAt: Date;

  constructor(
    id: number,
    partnerId: number,
    planId: number,
    planType: PlanType,
    status: SubscriptionStatus,
    billingFrequency: BillingFrequency,
    billingAmount: number,
    basePrice: number,
    taxAmount: number,
    totalPrice: number,
    includeTax: boolean,
    taxPercent: number | null,
    currency: string,
    currencyId: number | null,
    currencyLabel: string | null,
    startDate: Date,
    renewalDate: Date,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    nextBillingDate: Date,
    nextBillingAmount: number,
    autoRenew: boolean,
    creditBalance: number,
    discountPercent: number | null,
    discountCode: string | null,
    lastPaymentDate: Date | null,
    lastPaymentAmount: number | null,
    paymentStatus: 'paid' | 'pending' | 'failed' | null,
    trialEndDate: Date | null,
    gracePeriodDays: number,
    daysUntilRenewal: number,
    isInGracePeriod: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.partnerId = partnerId;
    this.planId = planId;
    this.planType = planType;
    this.status = status;
    this.billingFrequency = billingFrequency;
    this.billingAmount = billingAmount;
    this.basePrice = basePrice;
    this.taxAmount = taxAmount;
    this.totalPrice = totalPrice;
    this.includeTax = includeTax;
    this.taxPercent = taxPercent;
    this.currency = currency;
    this.currencyId = currencyId;
    this.currencyLabel = currencyLabel;
    this.startDate = startDate;
    this.renewalDate = renewalDate;
    this.currentPeriodStart = currentPeriodStart;
    this.currentPeriodEnd = currentPeriodEnd;
    this.nextBillingDate = nextBillingDate;
    this.nextBillingAmount = nextBillingAmount;
    this.autoRenew = autoRenew;
    this.creditBalance = creditBalance;
    this.discountPercent = discountPercent;
    this.discountCode = discountCode;
    this.lastPaymentDate = lastPaymentDate;
    this.lastPaymentAmount = lastPaymentAmount;
    this.paymentStatus = paymentStatus;
    this.trialEndDate = trialEndDate;
    this.gracePeriodDays = gracePeriodDays;
    this.daysUntilRenewal = daysUntilRenewal;
    this.isInGracePeriod = isInGracePeriod;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
