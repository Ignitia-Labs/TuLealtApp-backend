import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatsResponse } from '../get-subscription-stats/get-subscription-stats.response';

export class ComparisonMetrics {
  @ApiProperty({ description: 'Cambio absoluto', example: 100.5 })
  absolute: number;

  @ApiProperty({ description: 'Cambio porcentual', example: 5.5 })
  percentage: number;

  constructor(absolute: number, percentage: number) {
    this.absolute = absolute;
    this.percentage = percentage;
  }
}

export class SubscriptionStatsComparison {
  @ApiProperty({ description: 'Comparación de MRR', type: ComparisonMetrics })
  mrr: ComparisonMetrics;

  @ApiProperty({ description: 'Comparación de ARR', type: ComparisonMetrics })
  arr: ComparisonMetrics;

  @ApiProperty({
    description: 'Comparación de suscripciones activas',
    type: ComparisonMetrics,
  })
  activeSubscriptions: ComparisonMetrics;

  @ApiProperty({
    description: 'Comparación de tasa de churn',
    type: ComparisonMetrics,
  })
  churnRate: ComparisonMetrics;

  @ApiProperty({
    description: 'Comparación de tasa de retención',
    type: ComparisonMetrics,
  })
  retentionRate: ComparisonMetrics;

  @ApiProperty({
    description: 'Comparación de tasa de renovación',
    type: ComparisonMetrics,
  })
  renewalRate: ComparisonMetrics;

  @ApiProperty({
    description: 'Comparación de tasa de éxito de pagos',
    type: ComparisonMetrics,
  })
  paymentSuccessRate: ComparisonMetrics;

  @ApiProperty({
    description: 'Comparación de revenue promedio por suscripción',
    type: ComparisonMetrics,
  })
  averageRevenuePerSubscription: ComparisonMetrics;

  @ApiProperty({ description: 'Comparación de revenue total', type: ComparisonMetrics })
  totalRevenue: ComparisonMetrics;

  @ApiProperty({
    description: 'Comparación de nuevas suscripciones',
    type: ComparisonMetrics,
  })
  newSubscriptions: ComparisonMetrics;

  @ApiProperty({
    description: 'Comparación de suscripciones canceladas',
    type: ComparisonMetrics,
  })
  cancelledSubscriptions: ComparisonMetrics;

  constructor(
    mrr: ComparisonMetrics,
    arr: ComparisonMetrics,
    activeSubscriptions: ComparisonMetrics,
    churnRate: ComparisonMetrics,
    retentionRate: ComparisonMetrics,
    renewalRate: ComparisonMetrics,
    paymentSuccessRate: ComparisonMetrics,
    averageRevenuePerSubscription: ComparisonMetrics,
    totalRevenue: ComparisonMetrics,
    newSubscriptions: ComparisonMetrics,
    cancelledSubscriptions: ComparisonMetrics,
  ) {
    this.mrr = mrr;
    this.arr = arr;
    this.activeSubscriptions = activeSubscriptions;
    this.churnRate = churnRate;
    this.retentionRate = retentionRate;
    this.renewalRate = renewalRate;
    this.paymentSuccessRate = paymentSuccessRate;
    this.averageRevenuePerSubscription = averageRevenuePerSubscription;
    this.totalRevenue = totalRevenue;
    this.newSubscriptions = newSubscriptions;
    this.cancelledSubscriptions = cancelledSubscriptions;
  }
}

export class GetSubscriptionStatsCompareResponse {
  @ApiProperty({
    description: 'Estadísticas del período actual',
    type: SubscriptionStatsResponse,
  })
  current: SubscriptionStatsResponse;

  @ApiProperty({
    description: 'Estadísticas del período anterior',
    type: SubscriptionStatsResponse,
  })
  previous: SubscriptionStatsResponse;

  @ApiProperty({
    description: 'Comparación entre períodos',
    type: SubscriptionStatsComparison,
  })
  comparison: SubscriptionStatsComparison;

  constructor(
    current: SubscriptionStatsResponse,
    previous: SubscriptionStatsResponse,
    comparison: SubscriptionStatsComparison,
  ) {
    this.current = current;
    this.previous = previous;
    this.comparison = comparison;
  }
}

