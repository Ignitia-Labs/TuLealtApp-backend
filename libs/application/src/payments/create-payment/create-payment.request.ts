import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsNotEmpty,
  Min,
  IsOptional,
  IsDateString,
  IsString,
  IsEnum,
  IsBoolean,
} from 'class-validator';

/**
 * DTO de request para crear un pago
 */
export class CreatePaymentRequest {
  @ApiProperty({
    description: 'ID de la suscripción asociada',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  subscriptionId: number;

  @ApiProperty({
    description: 'ID de la factura asociada (opcional)',
    example: 1,
    type: Number,
    minimum: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  invoiceId?: number;

  @ApiProperty({
    description: 'ID del ciclo de facturación asociado (opcional)',
    example: 1,
    type: Number,
    minimum: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  billingCycleId?: number;

  @ApiProperty({
    description: 'Monto del pago',
    example: 99.99,
    type: Number,
    minimum: 0.01,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Moneda del pago',
    example: 'USD',
    type: String,
    required: false,
    default: 'USD',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Método de pago',
    example: 'credit_card',
    enum: ['credit_card', 'bank_transfer', 'cash', 'other'],
  })
  @IsEnum(['credit_card', 'bank_transfer', 'cash', 'other'])
  @IsNotEmpty()
  paymentMethod: 'credit_card' | 'bank_transfer' | 'cash' | 'other';

  @ApiProperty({
    description: 'Estado del pago',
    example: 'pending_validation',
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
    required: false,
    default: 'pending_validation',
  })
  @IsEnum([
    'pending',
    'pending_validation',
    'validated',
    'rejected',
    'paid',
    'failed',
    'refunded',
    'cancelled',
  ])
  @IsOptional()
  status?:
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
    required: false,
  })
  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @ApiProperty({
    description: 'Referencia del pago',
    example: 'REF-2024-001',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiProperty({
    description: 'Código de confirmación',
    example: 'CONF-123456',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  confirmationCode?: string;

  @ApiProperty({
    description: 'Gateway de pago usado',
    example: 'stripe',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  gateway?: string;

  @ApiProperty({
    description: 'ID de transacción del gateway',
    example: 'ch_1234567890',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  gatewayTransactionId?: string;

  @ApiProperty({
    description: 'Últimos 4 dígitos de la tarjeta',
    example: '4242',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  cardLastFour?: string;

  @ApiProperty({
    description: 'Marca de la tarjeta',
    example: 'Visa',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  cardBrand?: string;

  @ApiProperty({
    description: 'Fecha de expiración de la tarjeta',
    example: '12/25',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  cardExpiry?: string;

  @ApiProperty({
    description: 'Indica si es un reintento de pago',
    example: false,
    type: Boolean,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isRetry?: boolean;

  @ApiProperty({
    description: 'Número de intento de reintento',
    example: null,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  retryAttempt?: number;

  @ApiProperty({
    description: 'Notas adicionales',
    example: 'Pago procesado exitosamente',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
