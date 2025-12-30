import { Injectable } from '@nestjs/common';
import { PartnerSubscription, SubscriptionEvent, Payment } from '@libs/domain';
import { SubscriptionStatsService, Period } from '../get-subscription-stats/subscription-stats.service';

export type GroupByPeriod = 'day' | 'week' | 'month' | 'quarter';

export type TimeseriesPeriodMetrics = {
  period: string;
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  totalSubscriptions: number;
  churnRate: number;
  retentionRate: number;
  renewalRate: number;
  paymentSuccessRate: number;
  totalRevenue: number;
  newSubscriptions: number;
  cancelledSubscriptions: number;
  upgrades: number;
  downgrades: number;
};

export type TimeseriesData = TimeseriesPeriodMetrics & {
  startDate: Date;
  endDate: Date;
};

/**
 * Servicio para calcular series temporales de estadísticas de suscripciones
 */
@Injectable()
export class SubscriptionTimeseriesService {
  constructor(private readonly statsService: SubscriptionStatsService) {}

  /**
   * Agrupa datos por período y calcula métricas para cada período
   */
  groupByPeriod(
    subscriptions: PartnerSubscription[],
    payments: Payment[],
    events: SubscriptionEvent[],
    startDate: Date,
    endDate: Date,
    groupBy: GroupByPeriod,
    exchangeRate: any,
  ): TimeseriesData[] {
    const periods = this.generatePeriods(startDate, endDate, groupBy);
    const timeseriesData: TimeseriesData[] = [];

    for (const period of periods) {
      // Filtrar datos para este período
      const periodSubscriptions = subscriptions.filter(
        (sub) =>
          (sub.createdAt <= period.endDate && (sub.renewalDate >= period.startDate || !sub.renewalDate)) ||
          (sub.createdAt >= period.startDate && sub.createdAt <= period.endDate),
      );

      const periodPayments = payments.filter(
        (payment) =>
          payment.paymentDate >= period.startDate && payment.paymentDate <= period.endDate,
      );

      const periodEvents = events.filter(
        (event) =>
          event.occurredAt >= period.startDate && event.occurredAt <= period.endDate,
      );

      // Calcular métricas para este período
      const metrics: TimeseriesPeriodMetrics = this.calculateMetricsForPeriod(
        periodSubscriptions,
        periodPayments,
        periodEvents,
        period,
        exchangeRate,
      );

      timeseriesData.push({
        ...metrics,
        startDate: period.startDate,
        endDate: period.endDate,
      });
    }

    return timeseriesData;
  }

  /**
   * Genera los períodos según el tipo de agrupación
   */
  private generatePeriods(startDate: Date, endDate: Date, groupBy: GroupByPeriod): Period[] {
    const periods: Period[] = [];
    let currentDate = new Date(startDate);

    while (currentDate < endDate) {
      const periodStart = new Date(currentDate);
      let periodEnd: Date;

      switch (groupBy) {
        case 'day':
          periodEnd = new Date(currentDate);
          periodEnd.setDate(periodEnd.getDate() + 1);
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'week':
          periodEnd = new Date(currentDate);
          periodEnd.setDate(periodEnd.getDate() + 7);
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'month':
          periodEnd = new Date(currentDate);
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'quarter':
          periodEnd = new Date(currentDate);
          periodEnd.setMonth(periodEnd.getMonth() + 3);
          currentDate.setMonth(currentDate.getMonth() + 3);
          break;
      }

      // Asegurar que el período final no exceda la fecha de fin
      if (periodEnd > endDate) {
        periodEnd = new Date(endDate);
      }

      periods.push({
        startDate: periodStart,
        endDate: periodEnd,
      });

      if (periodEnd >= endDate) {
        break;
      }
    }

    return periods;
  }

  /**
   * Calcula métricas para un período específico
   */
  private calculateMetricsForPeriod(
    periodSubscriptions: PartnerSubscription[],
    periodPayments: Payment[],
    periodEvents: SubscriptionEvent[],
    period: Period,
    exchangeRate: any,
  ): TimeseriesPeriodMetrics {
    const stats = this.statsService.calculateStats(
      periodSubscriptions,
      periodPayments,
      periodEvents,
      period,
      exchangeRate,
    );

    // Generar identificador del período
    const periodLabel = this.getPeriodLabel(period.startDate, period.endDate);

    return {
      period: periodLabel,
      mrr: stats.mrr,
      arr: stats.arr,
      activeSubscriptions: stats.activeSubscriptions,
      totalSubscriptions: stats.totalSubscriptions,
      churnRate: stats.churnRate,
      retentionRate: stats.retentionRate,
      renewalRate: stats.renewalRate,
      paymentSuccessRate: stats.paymentSuccessRate,
      totalRevenue: stats.totalRevenue,
      newSubscriptions: stats.newSubscriptions,
      cancelledSubscriptions: stats.cancelledSubscriptions,
      upgrades: stats.upgrades,
      downgrades: stats.downgrades,
    };
  }

  /**
   * Genera una etiqueta legible para el período
   */
  private getPeriodLabel(startDate: Date, endDate: Date): string {
    const startYear = startDate.getFullYear();
    const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
    const startDay = String(startDate.getDate()).padStart(2, '0');
    const endYear = endDate.getFullYear();
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDate.getDate()).padStart(2, '0');

    return `${startYear}-${startMonth}-${startDay} to ${endYear}-${endMonth}-${endDay}`;
  }
}

