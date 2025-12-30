import { IsOptional, IsEnum, IsNumber, IsString, Min, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionEventType } from '@libs/domain';

export class GetSubscriptionEventsRequest {
  @ApiPropertyOptional({
    description: 'ID de la suscripción',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  subscriptionId?: number;

  @ApiPropertyOptional({
    description: 'Fecha de inicio del período (formato: YYYY-MM-DD)',
    type: String,
    example: '2024-01-01',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'startDate must be in format YYYY-MM-DD (e.g., 2024-01-01)',
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin del período (formato: YYYY-MM-DD)',
    type: String,
    example: '2024-12-31',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'endDate must be in format YYYY-MM-DD (e.g., 2024-12-31)',
  })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Tipo de evento',
    enum: [
      'created',
      'activated',
      'suspended',
      'cancelled',
      'renewed',
      'payment_received',
      'payment_failed',
      'plan_changed',
      'paused',
      'resumed',
      'expired',
      'trial_started',
      'trial_ended',
      'custom',
    ],
    example: 'created',
  })
  @IsOptional()
  @IsEnum([
    'created',
    'activated',
    'suspended',
    'cancelled',
    'renewed',
    'payment_received',
    'payment_failed',
    'plan_changed',
    'paused',
    'resumed',
    'expired',
    'trial_started',
    'trial_ended',
    'custom',
  ])
  type?: SubscriptionEventType;

  @ApiPropertyOptional({
    description: 'Número de página',
    type: Number,
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Cantidad de elementos por página',
    type: Number,
    example: 10,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

