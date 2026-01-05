import { Injectable } from '@nestjs/common';
import { PartnerSubscription, SubscriptionEvent, Payment, RateExchange } from '@libs/domain';

export type Period = {
  startDate: Date;
  endDate: Date;
};

export type SubscriptionStats = {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  totalSubscriptions: number;
  churnRate: number;
  retentionRate: number;
  renewalRate: number;
  paymentSuccessRate: number;
  averageRevenuePerSubscription: number;
  totalRevenue: number;
  newSubscriptions: number;
  cancelledSubscriptions: number;
  upgrades: number;
  downgrades: number;
  byPlanType: {
    esencia: { count: number; mrr: number };
    conecta: { count: number; mrr: number };
    inspira: { count: number; mrr: number };
  };
  byCurrency: {
    USD: { count: number; mrr: number };
    GTQ: { count: number; mrr: number };
  };
};

/**
 * Servicio para calcular estadísticas de suscripciones
 */
@Injectable()
export class SubscriptionStatsService {
  /**
   * Calcula el MRR (Monthly Recurring Revenue) de una lista de suscripciones
   * Solo incluye suscripciones activas
   */
  calculateMRR(subscriptions: PartnerSubscription[]): number {
    const activeSubscriptions = subscriptions.filter((sub) => sub.status === 'active');

    return activeSubscriptions.reduce((total, sub) => {
      const mrr = this.getMRRForSubscription(sub);
      return total + mrr;
    }, 0);
  }

  /**
   * Calcula el MRR para una suscripción individual según su frecuencia de facturación
   */
  private getMRRForSubscription(subscription: PartnerSubscription): number {
    switch (subscription.billingFrequency) {
      case 'monthly':
        return subscription.billingAmount;
      case 'quarterly':
        return subscription.billingAmount / 3;
      case 'semiannual':
        return subscription.billingAmount / 6;
      case 'annual':
        return subscription.billingAmount / 12;
      default:
        return 0;
    }
  }

  /**
   * Calcula el ARR (Annual Recurring Revenue) a partir del MRR
   */
  calculateARR(mrr: number): number {
    return mrr * 12;
  }

  /**
   * Convierte un monto a USD usando el tipo de cambio
   */
  convertToUSD(amount: number, currency: string, exchangeRate: RateExchange | null): number {
    if (currency === 'USD') {
      return amount;
    }

    if (currency === 'GTQ' && exchangeRate) {
      return exchangeRate.convertGtqToUsd(amount);
    }

    // Si no hay exchange rate o la moneda no es reconocida, retornar el monto original
    return amount;
  }

  /**
   * Calcula el churn rate para un período
   */
  calculateChurnRate(
    events: SubscriptionEvent[],
    period: Period,
    activeSubscriptionsAtStart: number,
  ): number {
    if (activeSubscriptionsAtStart === 0) {
      return 0;
    }

    const cancellations = events.filter(
      (event) =>
        event.type === 'cancelled' &&
        event.occurredAt >= period.startDate &&
        event.occurredAt <= period.endDate,
    ).length;

    return (cancellations / activeSubscriptionsAtStart) * 100;
  }

  /**
   * Calcula el retention rate a partir del churn rate
   */
  calculateRetentionRate(churnRate: number): number {
    return Math.max(0, 100 - churnRate);
  }

  /**
   * Calcula el renewal rate para un período
   */
  calculateRenewalRate(events: SubscriptionEvent[], period: Period): number {
    const renewals = events.filter(
      (event) =>
        event.type === 'renewed' &&
        event.occurredAt >= period.startDate &&
        event.occurredAt <= period.endDate,
    );

    const totalRenewals = renewals.length;
    if (totalRenewals === 0) {
      return 0;
    }

    const successfulRenewals = renewals.filter((event) => {
      // Asumimos que un renewal es exitoso si no hay evento de cancelación después
      // En una implementación más completa, esto debería verificarse con el estado de la suscripción
      return true; // Por ahora, todos los renewals son exitosos
    }).length;

    return (successfulRenewals / totalRenewals) * 100;
  }

  /**
   * Calcula el payment success rate para un período
   */
  calculatePaymentSuccessRate(payments: Payment[], period: Period): number {
    const periodPayments = payments.filter(
      (payment) => payment.paymentDate >= period.startDate && payment.paymentDate <= period.endDate,
    );

    if (periodPayments.length === 0) {
      return 0;
    }

    const successfulPayments = periodPayments.filter((payment) => payment.status === 'paid').length;
    return (successfulPayments / periodPayments.length) * 100;
  }

  /**
   * Calcula estadísticas completas para un período
   */
  calculateStats(
    subscriptions: PartnerSubscription[],
    payments: Payment[],
    events: SubscriptionEvent[],
    period: Period,
    exchangeRate: RateExchange | null,
  ): SubscriptionStats {
    const activeSubscriptions = subscriptions.filter((sub) => sub.status === 'active');
    const activeSubscriptionsAtStart = subscriptions.filter(
      (sub) => sub.status === 'active' && sub.startDate <= period.startDate,
    ).length;

    // Calcular MRR y ARR
    let totalMRR = 0;
    const mrrByCurrency: { [key: string]: number } = {};

    activeSubscriptions.forEach((sub) => {
      const mrr = this.getMRRForSubscription(sub);
      const mrrUSD = this.convertToUSD(mrr, sub.currency, exchangeRate);
      totalMRR += mrrUSD;

      if (!mrrByCurrency[sub.currency]) {
        mrrByCurrency[sub.currency] = 0;
      }
      mrrByCurrency[sub.currency] += mrr;
    });

    const arr = this.calculateARR(totalMRR);

    // Calcular métricas de churn y retención
    const churnRate = this.calculateChurnRate(events, period, activeSubscriptionsAtStart);
    const retentionRate = this.calculateRetentionRate(churnRate);
    const renewalRate = this.calculateRenewalRate(events, period);
    const paymentSuccessRate = this.calculatePaymentSuccessRate(payments, period);

    // Calcular nuevas suscripciones y cancelaciones
    const newSubscriptions = events.filter(
      (event) =>
        event.type === 'created' &&
        event.occurredAt >= period.startDate &&
        event.occurredAt <= period.endDate,
    ).length;

    const cancelledSubscriptions = events.filter(
      (event) =>
        event.type === 'cancelled' &&
        event.occurredAt >= period.startDate &&
        event.occurredAt <= period.endDate,
    ).length;

    // Calcular upgrades y downgrades (simplificado - se puede mejorar)
    const upgrades = events.filter(
      (event) =>
        event.type === 'plan_changed' &&
        event.occurredAt >= period.startDate &&
        event.occurredAt <= period.endDate,
      // En una implementación completa, deberíamos verificar si el cambio fue un upgrade
    ).length;

    const downgrades = 0; // Por ahora, no rastreamos downgrades específicamente

    // Calcular revenue total
    const totalRevenue = payments
      .filter(
        (payment) =>
          payment.status === 'paid' &&
          payment.paymentDate >= period.startDate &&
          payment.paymentDate <= period.endDate,
      )
      .reduce((total, payment) => {
        const amountUSD = this.convertToUSD(payment.amount, payment.currency, exchangeRate);
        return total + amountUSD;
      }, 0);

    // Calcular promedio de revenue por suscripción
    const averageRevenuePerSubscription =
      activeSubscriptions.length > 0 ? totalMRR / activeSubscriptions.length : 0;

    // Estadísticas por tipo de plan
    const byPlanType = {
      esencia: { count: 0, mrr: 0 },
      conecta: { count: 0, mrr: 0 },
      inspira: { count: 0, mrr: 0 },
    };

    activeSubscriptions.forEach((sub) => {
      if (byPlanType[sub.planType]) {
        byPlanType[sub.planType].count++;
        const mrr = this.getMRRForSubscription(sub);
        const mrrUSD = this.convertToUSD(mrr, sub.currency, exchangeRate);
        byPlanType[sub.planType].mrr += mrrUSD;
      }
    });

    // Estadísticas por moneda
    const byCurrency = {
      USD: { count: 0, mrr: 0 },
      GTQ: { count: 0, mrr: 0 },
    };

    activeSubscriptions.forEach((sub) => {
      if (byCurrency[sub.currency]) {
        byCurrency[sub.currency].count++;
        const mrr = this.getMRRForSubscription(sub);
        byCurrency[sub.currency].mrr += mrr;
      }
    });

    return {
      mrr: totalMRR,
      arr,
      activeSubscriptions: activeSubscriptions.length,
      totalSubscriptions: subscriptions.length,
      churnRate,
      retentionRate,
      renewalRate,
      paymentSuccessRate,
      averageRevenuePerSubscription,
      totalRevenue,
      newSubscriptions,
      cancelledSubscriptions,
      upgrades,
      downgrades,
      byPlanType,
      byCurrency,
    };
  }
}
