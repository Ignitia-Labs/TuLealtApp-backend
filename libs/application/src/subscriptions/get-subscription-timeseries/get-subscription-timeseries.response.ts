import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatsResponse } from '../get-subscription-stats/get-subscription-stats.response';

export class PeriodMetrics {
  @ApiProperty({ description: 'Identificador del período', example: '2024-01-01 to 2024-01-31' })
  period: string;

  @ApiProperty({ description: 'MRR en USD', example: 1599.8 })
  mrr: number;

  @ApiProperty({ description: 'ARR en USD', example: 19197.6 })
  arr: number;

  @ApiProperty({ description: 'Suscripciones activas', example: 20 })
  activeSubscriptions: number;

  @ApiProperty({ description: 'Total de suscripciones', example: 25 })
  totalSubscriptions: number;

  @ApiProperty({ description: 'Tasa de churn (%)', example: 5.5 })
  churnRate: number;

  @ApiProperty({ description: 'Tasa de retención (%)', example: 94.5 })
  retentionRate: number;

  @ApiProperty({ description: 'Tasa de renovación (%)', example: 95.0 })
  renewalRate: number;

  @ApiProperty({ description: 'Tasa de éxito de pagos (%)', example: 98.5 })
  paymentSuccessRate: number;

  @ApiProperty({ description: 'Revenue total en USD', example: 15998.0 })
  totalRevenue: number;

  @ApiProperty({ description: 'Nuevas suscripciones', example: 5 })
  newSubscriptions: number;

  @ApiProperty({ description: 'Suscripciones canceladas', example: 2 })
  cancelledSubscriptions: number;

  @ApiProperty({ description: 'Upgrades', example: 3 })
  upgrades: number;

  @ApiProperty({ description: 'Downgrades', example: 0 })
  downgrades: number;

  @ApiProperty({ description: 'Fecha de inicio del período', example: '2024-01-01T00:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ description: 'Fecha de fin del período', example: '2024-01-31T23:59:59.999Z' })
  endDate: Date;
}

export class GetSubscriptionTimeseriesResponse {
  @ApiProperty({
    description: 'Serie temporal de métricas agrupadas por período',
    type: [PeriodMetrics],
  })
  series: PeriodMetrics[];

  @ApiProperty({
    description: 'Estadísticas agregadas del período completo',
    type: SubscriptionStatsResponse,
  })
  summary: SubscriptionStatsResponse;

  @ApiProperty({ description: 'Total de períodos', example: 12 })
  totalPeriods: number;

  constructor(
    series: PeriodMetrics[],
    summary: SubscriptionStatsResponse,
    totalPeriods: number,
  ) {
    this.series = series;
    this.summary = summary;
    this.totalPeriods = totalPeriods;
  }
}

