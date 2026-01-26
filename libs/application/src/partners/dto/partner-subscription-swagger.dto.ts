import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para documentación Swagger de PartnerSubscription
 */
export class PartnerSubscriptionSwaggerDto {
  @ApiProperty({
    example: 'plan-conecta',
    description: 'ID del plan de suscripción',
  })
  planId: string;

  @ApiProperty({
    example: 'conecta',
    description: 'Tipo de plan',
    enum: ['esencia', 'conecta', 'inspira'],
  })
  planType: 'esencia' | 'conecta' | 'inspira';

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Fecha de inicio de la suscripción',
    type: Date,
  })
  startDate: Date;

  @ApiProperty({
    example: '2025-01-01T00:00:00Z',
    description: 'Fecha de renovación de la suscripción',
    type: Date,
  })
  renewalDate: Date;

  @ApiProperty({
    example: 'active',
    description: 'Estado de la suscripción',
    enum: ['active', 'expired', 'suspended', 'cancelled', 'trialing', 'past_due', 'paused'],
  })
  status: 'active' | 'expired' | 'suspended' | 'cancelled' | 'trialing' | 'past_due' | 'paused';

  @ApiProperty({
    example: 'monthly',
    description: 'Frecuencia de facturación',
    enum: ['monthly', 'quarterly', 'semiannual', 'annual'],
  })
  billingFrequency: 'monthly' | 'quarterly' | 'semiannual' | 'annual';

  @ApiProperty({
    example: 99.0,
    description: 'Monto de facturación',
    type: Number,
  })
  billingAmount: number;

  @ApiProperty({
    example: false,
    description: 'Indica si el precio incluye impuestos',
    type: Boolean,
  })
  includeTax: boolean;

  @ApiProperty({
    example: 12.0,
    description: 'Porcentaje de impuesto aplicado',
    type: Number,
    nullable: true,
  })
  taxPercent: number | null;

  @ApiProperty({
    example: 88.39,
    description: 'Precio base sin impuestos',
    type: Number,
  })
  basePrice: number;

  @ApiProperty({
    example: 10.61,
    description: 'Monto de impuestos',
    type: Number,
  })
  taxAmount: number;

  @ApiProperty({
    example: 99.0,
    description: 'Precio total con impuestos',
    type: Number,
  })
  totalPrice: number;

  @ApiProperty({
    example: 'USD',
    description: 'Moneda',
    type: String,
  })
  currency: string;

  @ApiProperty({
    example: 1,
    description: 'ID de la moneda',
    type: Number,
    nullable: true,
  })
  currencyId: number | null;

  @ApiProperty({
    example: '2025-01-01T00:00:00Z',
    description: 'Fecha del próximo pago',
    type: Date,
  })
  nextBillingDate: Date;

  @ApiProperty({
    example: 99.0,
    description: 'Monto del próximo pago',
    type: Number,
  })
  nextBillingAmount: number;

  @ApiProperty({
    example: '2024-12-01T00:00:00Z',
    description: 'Inicio del período actual',
    type: Date,
  })
  currentPeriodStart: Date;

  @ApiProperty({
    example: '2025-01-01T00:00:00Z',
    description: 'Fin del período actual',
    type: Date,
  })
  currentPeriodEnd: Date;

  @ApiProperty({
    example: '2024-01-15T00:00:00Z',
    description: 'Fecha de fin del período de prueba',
    type: Date,
    nullable: true,
  })
  trialEndDate: Date | null;

  @ApiProperty({
    example: '2024-01-10T00:00:00Z',
    description: 'Fecha en que la suscripción fue pausada',
    type: Date,
    nullable: true,
  })
  pausedAt: Date | null;

  @ApiProperty({
    example: 'Pausado por solicitud del cliente',
    description: 'Razón de la pausa de la suscripción',
    type: String,
    nullable: true,
  })
  pauseReason: string | null;

  @ApiProperty({
    example: 7,
    description: 'Días de gracia antes de suspender por falta de pago',
    type: Number,
  })
  gracePeriodDays: number;

  @ApiProperty({
    example: 0,
    description: 'Número de intentos de reintento de pago',
    type: Number,
  })
  retryAttempts: number;

  @ApiProperty({
    example: 3,
    description: 'Número máximo de intentos de reintento de pago',
    type: Number,
  })
  maxRetryAttempts: number;

  @ApiProperty({
    example: 10.0,
    description: 'Porcentaje de descuento aplicado',
    type: Number,
    nullable: true,
  })
  discountPercent: number | null;

  @ApiProperty({
    example: 'PROMO2024',
    description: 'Código de descuento aplicado',
    type: String,
    nullable: true,
  })
  discountCode: string | null;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Fecha del último pago',
    type: Date,
    nullable: true,
  })
  lastPaymentDate: Date | null;

  @ApiProperty({
    example: 99.0,
    description: 'Monto del último pago',
    type: Number,
    nullable: true,
  })
  lastPaymentAmount: number | null;

  @ApiProperty({
    example: 'paid',
    description: 'Estado del último pago',
    enum: ['paid', 'pending', 'failed'],
    nullable: true,
  })
  paymentStatus: 'paid' | 'pending' | 'failed' | null;

  @ApiProperty({
    example: true,
    description: 'Indica si la renovación es automática',
    type: Boolean,
  })
  autoRenew: boolean;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Fecha de creación de la suscripción',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-11-01T00:00:00Z',
    description: 'Fecha de última actualización de la suscripción',
    type: Date,
  })
  updatedAt: Date;
}
