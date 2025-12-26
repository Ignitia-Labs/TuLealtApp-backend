import { IsNumber } from 'class-validator';
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
    description: 'Auto-renovación de la suscripción',
    example: true,
    type: Boolean,
    required: false,
  })
  subscriptionAutoRenew?: boolean;

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
