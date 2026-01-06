import { IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para procesar una solicitud de partner (convertirla en partner)
 */
export class ProcessPartnerRequestRequest {
  @ApiProperty({
    description: 'ID de la solicitud a procesar',
    example: 1,
    type: Number,
  })
  @IsNumber()
  requestId: number;

  @ApiProperty({
    description: 'ID del plan de suscripción',
    example: 'plan-conecta',
    type: String,
    required: false,
  })
  subscriptionPlanId?: string;

  @ApiProperty({
    description: 'Fecha de inicio de la suscripción',
    example: '2024-01-01T00:00:00Z',
    type: String,
    required: false,
  })
  subscriptionStartDate?: string;

  @ApiProperty({
    description: 'Fecha de renovación de la suscripción',
    example: '2025-01-01T00:00:00Z',
    type: String,
    required: false,
  })
  subscriptionRenewalDate?: string;

  @ApiProperty({
    description: 'Monto del último pago',
    example: 99.0,
    type: Number,
    required: false,
  })
  subscriptionLastPaymentAmount?: number;

  @ApiProperty({
    description: 'Base price for the subscription (amount without tax)',
    example: 99.0,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  subscriptionBasePrice?: number;

  @ApiProperty({
    description: 'Tax amount to apply to the subscription',
    example: 11.88,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  subscriptionTaxAmount?: number;

  @ApiProperty({
    description: 'Total price to bill (basePrice + taxAmount)',
    example: 110.88,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  subscriptionTotalPrice?: number;

  @ApiProperty({
    description: 'Auto-renovación de la suscripción',
    example: true,
    type: Boolean,
    required: false,
  })
  subscriptionAutoRenew?: boolean;

  @ApiProperty({
    description: 'Frecuencia de facturación (sobrescribe la del partner request si se proporciona)',
    example: 'monthly',
    enum: ['monthly', 'quarterly', 'semiannual', 'annual'],
    required: false,
  })
  @IsEnum(['monthly', 'quarterly', 'semiannual', 'annual'])
  @IsOptional()
  subscriptionBillingFrequency?: 'monthly' | 'quarterly' | 'semiannual' | 'annual';

  @ApiProperty({
    description: 'Whether to include tax in the subscription price',
    example: true,
    type: Boolean,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  subscriptionIncludeTax?: boolean;

  @ApiProperty({
    description: 'Tax percentage to apply (e.g., 12 for 12%)',
    example: 12.0,
    type: Number,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  subscriptionTaxPercent?: number | null;

  @ApiProperty({
    description:
      'ID de la moneda para la suscripción (referencia a la tabla currencies). Si no se proporciona, se usará el subscriptionCurrencyId del partner request o el currencyId del partner request como fallback',
    example: 1,
    type: Number,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  subscriptionCurrencyId?: number | null;

  @ApiProperty({
    description: 'Límite máximo de tenants',
    example: 5,
    type: Number,
    required: false,
  })
  limitsMaxTenants?: number;

  @ApiProperty({
    description: 'Límite máximo de branches',
    example: 20,
    type: Number,
    required: false,
  })
  limitsMaxBranches?: number;

  @ApiProperty({
    description: 'Límite máximo de customers',
    example: 5000,
    type: Number,
    required: false,
  })
  limitsMaxCustomers?: number;

  @ApiProperty({
    description: 'Límite máximo de rewards',
    example: 50,
    type: Number,
    required: false,
  })
  limitsMaxRewards?: number;

  @ApiProperty({
    description: 'Dominio del partner (se generará automáticamente si no se proporciona)',
    example: 'cocinasol.gt',
    type: String,
    required: false,
  })
  domain?: string;
}
