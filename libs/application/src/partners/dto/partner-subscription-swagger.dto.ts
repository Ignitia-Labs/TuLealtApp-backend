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
    enum: ['active', 'expired', 'suspended', 'cancelled'],
  })
  status: 'active' | 'expired' | 'suspended' | 'cancelled';

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
}
