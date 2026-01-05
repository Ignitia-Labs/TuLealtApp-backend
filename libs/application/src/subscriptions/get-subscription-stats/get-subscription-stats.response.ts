import { ApiProperty } from '@nestjs/swagger';

export class PlanTypeStats {
  @ApiProperty({ description: 'Cantidad de suscripciones', example: 10 })
  count: number;

  @ApiProperty({ description: 'MRR en USD', example: 799.9 })
  mrr: number;
}

export class CurrencyStats {
  @ApiProperty({ description: 'Cantidad de suscripciones', example: 5 })
  count: number;

  @ApiProperty({ description: 'MRR en la moneda original', example: 799.9 })
  mrr: number;
}

export class SubscriptionStatsResponse {
  @ApiProperty({ description: 'Monthly Recurring Revenue en USD', example: 1599.8 })
  mrr: number;

  @ApiProperty({ description: 'Annual Recurring Revenue en USD', example: 19197.6 })
  arr: number;

  @ApiProperty({ description: 'Número de suscripciones activas', example: 20 })
  activeSubscriptions: number;

  @ApiProperty({ description: 'Total de suscripciones (todas las estados)', example: 25 })
  totalSubscriptions: number;

  @ApiProperty({ description: 'Tasa de churn (%)', example: 5.5 })
  churnRate: number;

  @ApiProperty({ description: 'Tasa de retención (%)', example: 94.5 })
  retentionRate: number;

  @ApiProperty({ description: 'Tasa de renovación (%)', example: 95.0 })
  renewalRate: number;

  @ApiProperty({ description: 'Tasa de éxito de pagos (%)', example: 98.5 })
  paymentSuccessRate: number;

  @ApiProperty({ description: 'Revenue promedio por suscripción', example: 79.99 })
  averageRevenuePerSubscription: number;

  @ApiProperty({ description: 'Revenue total del período en USD', example: 15998.0 })
  totalRevenue: number;

  @ApiProperty({ description: 'Nuevas suscripciones en el período', example: 5 })
  newSubscriptions: number;

  @ApiProperty({ description: 'Suscripciones canceladas en el período', example: 2 })
  cancelledSubscriptions: number;

  @ApiProperty({ description: 'Upgrades en el período', example: 3 })
  upgrades: number;

  @ApiProperty({ description: 'Downgrades en el período', example: 0 })
  downgrades: number;

  @ApiProperty({ description: 'Estadísticas por tipo de plan', type: PlanTypeStats })
  byPlanType: {
    esencia: PlanTypeStats;
    conecta: PlanTypeStats;
    inspira: PlanTypeStats;
  };

  @ApiProperty({ description: 'Estadísticas por moneda', type: CurrencyStats })
  byCurrency: {
    USD: CurrencyStats;
    GTQ: CurrencyStats;
  };

  constructor(
    mrr: number,
    arr: number,
    activeSubscriptions: number,
    totalSubscriptions: number,
    churnRate: number,
    retentionRate: number,
    renewalRate: number,
    paymentSuccessRate: number,
    averageRevenuePerSubscription: number,
    totalRevenue: number,
    newSubscriptions: number,
    cancelledSubscriptions: number,
    upgrades: number,
    downgrades: number,
    byPlanType: {
      esencia: PlanTypeStats;
      conecta: PlanTypeStats;
      inspira: PlanTypeStats;
    },
    byCurrency: {
      USD: CurrencyStats;
      GTQ: CurrencyStats;
    },
  ) {
    this.mrr = mrr;
    this.arr = arr;
    this.activeSubscriptions = activeSubscriptions;
    this.totalSubscriptions = totalSubscriptions;
    this.churnRate = churnRate;
    this.retentionRate = retentionRate;
    this.renewalRate = renewalRate;
    this.paymentSuccessRate = paymentSuccessRate;
    this.averageRevenuePerSubscription = averageRevenuePerSubscription;
    this.totalRevenue = totalRevenue;
    this.newSubscriptions = newSubscriptions;
    this.cancelledSubscriptions = cancelledSubscriptions;
    this.upgrades = upgrades;
    this.downgrades = downgrades;
    this.byPlanType = byPlanType;
    this.byCurrency = byCurrency;
  }
}
