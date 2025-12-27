import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para crear una suscripción
 */
export class CreateSubscriptionRequest {
  @ApiProperty({
    description: 'ID del partner al que pertenece la suscripción',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  partnerId: number;

  @ApiProperty({
    description: 'ID del plan de suscripción',
    example: 'plan-conecta',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({
    description: 'Tipo de plan',
    example: 'conecta',
    enum: ['esencia', 'conecta', 'inspira'],
  })
  @IsEnum(['esencia', 'conecta', 'inspira'])
  @IsNotEmpty()
  planType: 'esencia' | 'conecta' | 'inspira';

  @ApiProperty({
    description: 'Fecha de inicio de la suscripción',
    example: '2024-01-01T00:00:00Z',
    type: String,
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'Fecha de renovación de la suscripción',
    example: '2025-01-01T00:00:00Z',
    type: String,
  })
  @IsDateString()
  @IsNotEmpty()
  renewalDate: string;

  @ApiProperty({
    description: 'Frecuencia de facturación',
    example: 'monthly',
    enum: ['monthly', 'quarterly', 'semiannual', 'annual'],
  })
  @IsEnum(['monthly', 'quarterly', 'semiannual', 'annual'])
  @IsNotEmpty()
  billingFrequency: 'monthly' | 'quarterly' | 'semiannual' | 'annual';

  @ApiProperty({
    description: 'Monto de facturación',
    example: 79.99,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  billingAmount: number;

  @ApiProperty({
    description: 'Moneda de la suscripción',
    example: 'USD',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    description: 'Fecha del próximo pago',
    example: '2024-02-01T00:00:00Z',
    type: String,
  })
  @IsDateString()
  @IsNotEmpty()
  nextBillingDate: string;

  @ApiProperty({
    description: 'Monto del próximo pago',
    example: 79.99,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  nextBillingAmount: number;

  @ApiProperty({
    description: 'Inicio del período actual',
    example: '2024-01-01T00:00:00Z',
    type: String,
  })
  @IsDateString()
  @IsNotEmpty()
  currentPeriodStart: string;

  @ApiProperty({
    description: 'Fin del período actual',
    example: '2024-02-01T00:00:00Z',
    type: String,
  })
  @IsDateString()
  @IsNotEmpty()
  currentPeriodEnd: string;

  @ApiProperty({
    description: 'Estado de la suscripción',
    example: 'active',
    enum: ['active', 'expired', 'suspended', 'cancelled', 'trialing', 'past_due', 'paused'],
    required: false,
    default: 'active',
  })
  @IsEnum(['active', 'expired', 'suspended', 'cancelled', 'trialing', 'past_due', 'paused'])
  @IsOptional()
  status?: 'active' | 'expired' | 'suspended' | 'cancelled' | 'trialing' | 'past_due' | 'paused';

  @ApiProperty({
    description: 'Incluir impuestos en el precio',
    example: false,
    type: Boolean,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  includeTax?: boolean;

  @ApiProperty({
    description: 'Porcentaje de impuesto (ej: 12 para 12%)',
    example: 12.0,
    type: Number,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  taxPercent?: number | null;

  @ApiProperty({
    description: 'Precio base (sin impuestos)',
    example: 79.99,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  basePrice?: number;

  @ApiProperty({
    description: 'Monto de impuesto',
    example: 9.60,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  taxAmount?: number;

  @ApiProperty({
    description: 'Precio total (base + impuestos)',
    example: 89.59,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  totalPrice?: number;

  @ApiProperty({
    description: 'Fecha de fin del período de prueba',
    example: '2024-01-15T00:00:00Z',
    type: String,
    required: false,
    nullable: true,
  })
  @IsDateString()
  @IsOptional()
  trialEndDate?: string | null;

  @ApiProperty({
    description: 'Días de gracia para pagos',
    example: 7,
    type: Number,
    required: false,
    default: 7,
  })
  @IsNumber()
  @IsOptional()
  gracePeriodDays?: number;

  @ApiProperty({
    description: 'Intentos de reintento de pago',
    example: 0,
    type: Number,
    required: false,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  retryAttempts?: number;

  @ApiProperty({
    description: 'Máximo número de intentos de reintento',
    example: 3,
    type: Number,
    required: false,
    default: 3,
  })
  @IsNumber()
  @IsOptional()
  maxRetryAttempts?: number;

  @ApiProperty({
    description: 'Saldo de crédito disponible',
    example: 0,
    type: Number,
    required: false,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  creditBalance?: number;

  @ApiProperty({
    description: 'Porcentaje de descuento aplicado',
    example: 10,
    type: Number,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  discountPercent?: number | null;

  @ApiProperty({
    description: 'Código de descuento aplicado',
    example: 'ANNUAL10',
    type: String,
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  discountCode?: string | null;

  @ApiProperty({
    description: 'Renovación automática',
    example: true,
    type: Boolean,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}

