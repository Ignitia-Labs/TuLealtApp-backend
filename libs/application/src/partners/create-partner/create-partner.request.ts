import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para crear un partner
 */
export class CreatePartnerRequest {
  @ApiProperty({
    description: 'Nombre del partner',
    example: 'Grupo Comercial ABC',
    type: String,
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: 'Nombre del responsable',
    example: 'María González',
    type: String,
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  responsibleName: string;

  @ApiProperty({
    description: 'Email del partner',
    example: 'maria@abc-comercial.com',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Teléfono del partner',
    example: '+502 2345-6789',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'ID del país del partner',
    example: 1,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  countryId?: number | null;

  @ApiProperty({
    description: 'Ciudad del partner',
    example: 'Ciudad de Guatemala',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'Plan del partner',
    example: 'conecta',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  plan: string;

  @ApiProperty({
    description: 'Categoría del negocio',
    example: 'Retail',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Tipo de recompensa',
    example: 'Por monto de compra',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  rewardType: string;

  @ApiProperty({
    description: 'ID de la moneda',
    example: 8,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  currencyId: number;

  @ApiProperty({
    description: 'Razón social del negocio',
    example: 'Grupo Comercial ABC S.A. de C.V.',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({
    description: 'Número de identificación fiscal',
    example: 'RFC-ABC-123456',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  taxId: string;

  @ApiProperty({
    description: 'Dirección fiscal',
    example: 'Zona 10, Guatemala City, Guatemala',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  fiscalAddress: string;

  @ApiProperty({
    description: 'Método de pago',
    example: 'Tarjeta de crédito',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiProperty({
    description: 'Email para facturación',
    example: 'facturacion@abc-comercial.com',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  billingEmail: string;

  @ApiProperty({
    description: 'Dominio del partner',
    example: 'abc-comercial.com',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  domain: string;

  @ApiProperty({
    description: 'URL del logo del partner',
    example: 'https://ui-avatars.com/api/?name=Grupo+ABC&background=4f46e5&color=fff',
    type: String,
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  logo?: string | null;

  @ApiProperty({
    description: 'URL del banner del partner',
    example: 'https://example.com/banners/partner-banner.jpg',
    type: String,
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  banner?: string | null;

  @ApiProperty({
    description: 'Número de sucursales',
    example: 5,
    type: Number,
    required: false,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  branchesNumber?: number;

  @ApiProperty({
    description: 'Sitio web del partner',
    example: 'https://abc-comercial.com',
    type: String,
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  website?: string | null;

  @ApiProperty({
    description: 'Redes sociales del partner',
    example: '@abccomercial',
    type: String,
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  socialMedia?: string | null;

  // Subscription data
  @ApiProperty({
    description: 'ID del plan de suscripción',
    example: 'plan-conecta',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  subscriptionPlanId: string;

  @ApiProperty({
    description: 'Fecha de inicio de la suscripción',
    example: '2024-01-01T00:00:00Z',
    type: String,
  })
  @IsDateString()
  @IsNotEmpty()
  subscriptionStartDate: string;

  @ApiProperty({
    description: 'Fecha de renovación de la suscripción',
    example: '2025-01-01T00:00:00Z',
    type: String,
  })
  @IsDateString()
  @IsNotEmpty()
  subscriptionRenewalDate: string;

  @ApiProperty({
    description: 'Monto del último pago',
    example: 99.0,
    type: Number,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  subscriptionLastPaymentAmount?: number | null;

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
    description: 'Renovación automática',
    example: true,
    type: Boolean,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  subscriptionAutoRenew?: boolean;

  @ApiProperty({
    description: 'Frecuencia de facturación',
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
      'ID de la moneda para la suscripción (referencia a la tabla currencies). Si no se proporciona, se usará la moneda del partner (currencyId)',
    example: 1,
    type: Number,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  subscriptionCurrencyId?: number | null;

  // Limits data
  @ApiProperty({
    description: 'Máximo número de tenants',
    example: 5,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  limitsMaxTenants: number;

  @ApiProperty({
    description: 'Máximo número de branches',
    example: 20,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  limitsMaxBranches: number;

  @ApiProperty({
    description: 'Máximo número de clientes',
    example: 5000,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  limitsMaxCustomers: number;

  @ApiProperty({
    description: 'Máximo número de recompensas',
    example: 50,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  limitsMaxRewards: number;
}
