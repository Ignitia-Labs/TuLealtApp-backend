import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para crear una solicitud de partner
 */
export class CreatePartnerRequestRequest {
  @ApiProperty({
    description: 'Nombre del partner',
    example: 'Restaurante La Cocina del Sol',
    type: String,
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: 'Nombre del responsable',
    example: 'Roberto Méndez',
    type: String,
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  responsibleName: string;

  @ApiProperty({
    description: 'Email del partner',
    example: 'roberto@cocinasol.gt',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Teléfono del partner',
    example: '+502 3333-4444',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'ID del país del partner (referencia al catálogo de países)',
    example: 1,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  countryId?: number | null;

  @ApiProperty({
    description: 'Ciudad del partner',
    example: 'Antigua Guatemala',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'Plan del partner (slug del plan)',
    example: 'conecta',
    enum: ['esencia', 'conecta', 'inspira'],
  })
  @IsString()
  @IsNotEmpty()
  plan: string;

  @ApiProperty({
    description:
      'ID del plan de precios (referencia a pricing_plans.id). Este es el campo principal que se usará para la suscripción.',
    example: 1,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  planId?: number | null;

  @ApiProperty({
    description: 'Frecuencia de facturación para la suscripción del partner',
    example: 'monthly',
    enum: ['monthly', 'quarterly', 'semiannual', 'annual'],
    required: false,
  })
  @IsEnum(['monthly', 'quarterly', 'semiannual', 'annual'])
  @IsOptional()
  billingFrequency?: 'monthly' | 'quarterly' | 'semiannual' | 'annual' | null;

  @ApiProperty({
    description: 'Logo del partner (URL)',
    example: 'https://ui-avatars.com/api/?name=Cocina+Sol&background=f97316&color=fff',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  logo?: string | null;

  @ApiProperty({
    description: 'Categoría del negocio',
    example: 'Restaurantes',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Número de sucursales',
    example: 3,
    type: Number,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  branchesNumber?: number;

  @ApiProperty({
    description: 'Sitio web del partner',
    example: 'https://cocinasol.gt',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  website?: string | null;

  @ApiProperty({
    description: 'Redes sociales del partner',
    example: '@cocinadelsolgt',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  socialMedia?: string | null;

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

  @ApiProperty({
    description:
      'Días de prueba gratuita personalizados para el partner. Si no se proporciona, se obtendrá del plan de precios (planId). Si se proporciona, este valor tendrá prioridad sobre el del plan.',
    example: 7,
    type: Number,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  trialDays?: number | null;

  @ApiProperty({
    description: 'Razón social',
    example: 'La Cocina del Sol S.A.',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({
    description: 'Número de identificación fiscal',
    example: '12345678-9',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  taxId: string;

  @ApiProperty({
    description: 'Dirección fiscal',
    example: '5ta Avenida Norte #10, Antigua Guatemala',
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
    example: 'facturacion@cocinasol.gt',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  billingEmail: string;

  @ApiProperty({
    description: 'Notas adicionales',
    example: 'Nueva solicitud pendiente de revisión',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string | null;
}
