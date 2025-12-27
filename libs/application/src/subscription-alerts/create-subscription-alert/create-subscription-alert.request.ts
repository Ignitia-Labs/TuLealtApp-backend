import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsBoolean,
  IsEnum,
  IsOptional,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para crear una alerta de suscripción
 */
export class CreateSubscriptionAlertRequest {
  @ApiProperty({
    description: 'ID de la suscripción',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  subscriptionId: number;

  @ApiProperty({
    description: 'ID del partner',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  partnerId: number;

  @ApiProperty({
    description: 'Tipo de alerta',
    example: 'renewal',
    enum: [
      'renewal',
      'payment_failed',
      'payment_due',
      'usage_warning',
      'limit_reached',
      'trial_ending',
      'expiring',
      'custom',
    ],
  })
  @IsEnum([
    'renewal',
    'payment_failed',
    'payment_due',
    'usage_warning',
    'limit_reached',
    'trial_ending',
    'expiring',
    'custom',
  ])
  @IsNotEmpty()
  type:
    | 'renewal'
    | 'payment_failed'
    | 'payment_due'
    | 'usage_warning'
    | 'limit_reached'
    | 'trial_ending'
    | 'expiring'
    | 'custom';

  @ApiProperty({
    description: 'Severidad de la alerta',
    example: 'info',
    enum: ['info', 'warning', 'critical'],
  })
  @IsEnum(['info', 'warning', 'critical'])
  @IsNotEmpty()
  severity: 'info' | 'warning' | 'critical';

  @ApiProperty({
    description: 'Título de la alerta',
    example: 'Renovación próxima',
    type: String,
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  title: string;

  @ApiProperty({
    description: 'Mensaje de la alerta',
    example: 'Tu suscripción se renovará automáticamente en 30 días',
    type: String,
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  message: string;

  @ApiProperty({
    description: 'Indica si se requiere acción',
    example: false,
    type: Boolean,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  actionRequired?: boolean;

  @ApiProperty({
    description: 'Etiqueta de la acción',
    example: 'Actualizar método de pago',
    type: String,
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  actionLabel?: string | null;

  @ApiProperty({
    description: 'URL de la acción',
    example: '/subscriptions/1/payment-methods',
    type: String,
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  actionUrl?: string | null;

  @ApiProperty({
    description: 'Estado de la alerta',
    example: 'active',
    enum: ['active', 'dismissed', 'resolved'],
    required: false,
    default: 'active',
  })
  @IsEnum(['active', 'dismissed', 'resolved'])
  @IsOptional()
  status?: 'active' | 'dismissed' | 'resolved';

  @ApiProperty({
    description: 'Notificar por email',
    example: true,
    type: Boolean,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  notifyEmail?: boolean;

  @ApiProperty({
    description: 'Notificar por push',
    example: true,
    type: Boolean,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  notifyPush?: boolean;
}

