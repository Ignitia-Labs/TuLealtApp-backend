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
 * DTO de request para actualizar una suscripción
 */
export class UpdateSubscriptionRequest {
  @ApiProperty({
    description: 'ID de la suscripción a actualizar',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  subscriptionId: number;

  @ApiProperty({
    description: 'ID del plan de suscripción',
    example: 'plan-conecta',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  planId?: string;

  @ApiProperty({
    description: 'Tipo de plan',
    example: 'conecta',
    enum: ['esencia', 'conecta', 'inspira'],
    required: false,
  })
  @IsEnum(['esencia', 'conecta', 'inspira'])
  @IsOptional()
  planType?: 'esencia' | 'conecta' | 'inspira';

  @ApiProperty({
    description: 'Estado de la suscripción',
    example: 'active',
    enum: ['active', 'expired', 'suspended', 'cancelled', 'trialing', 'past_due', 'paused'],
    required: false,
  })
  @IsEnum(['active', 'expired', 'suspended', 'cancelled', 'trialing', 'past_due', 'paused'])
  @IsOptional()
  status?: 'active' | 'expired' | 'suspended' | 'cancelled' | 'trialing' | 'past_due' | 'paused';

  @ApiProperty({
    description: 'Fecha de renovación de la suscripción',
    example: '2025-01-01T00:00:00Z',
    type: String,
    required: false,
  })
  @IsDateString()
  @IsOptional()
  renewalDate?: string;

  @ApiProperty({
    description: 'Frecuencia de facturación',
    example: 'monthly',
    enum: ['monthly', 'quarterly', 'semiannual', 'annual'],
    required: false,
  })
  @IsEnum(['monthly', 'quarterly', 'semiannual', 'annual'])
  @IsOptional()
  billingFrequency?: 'monthly' | 'quarterly' | 'semiannual' | 'annual';

  @ApiProperty({
    description: 'Monto de facturación',
    example: 79.99,
    type: Number,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  billingAmount?: number;

  @ApiProperty({
    description: 'Fecha del próximo pago',
    example: '2024-02-01T00:00:00Z',
    type: String,
    required: false,
  })
  @IsDateString()
  @IsOptional()
  nextBillingDate?: string;

  @ApiProperty({
    description: 'Monto del próximo pago',
    example: 79.99,
    type: Number,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  nextBillingAmount?: number;

  @ApiProperty({
    description: 'Inicio del período actual',
    example: '2024-01-01T00:00:00Z',
    type: String,
    required: false,
  })
  @IsDateString()
  @IsOptional()
  currentPeriodStart?: string;

  @ApiProperty({
    description: 'Fin del período actual',
    example: '2024-02-01T00:00:00Z',
    type: String,
    required: false,
  })
  @IsDateString()
  @IsOptional()
  currentPeriodEnd?: string;

  @ApiProperty({
    description: 'Renovación automática',
    example: true,
    type: Boolean,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  // NOTA: creditBalance fue eliminado - se calcula dinámicamente desde los pagos
  // Ver CreditBalanceService para el cálculo dinámico

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
}

