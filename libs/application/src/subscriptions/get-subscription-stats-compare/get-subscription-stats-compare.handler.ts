import { Injectable, BadRequestException } from '@nestjs/common';
import { GetSubscriptionStatsCompareRequest } from './get-subscription-stats-compare.request';
import { GetSubscriptionStatsCompareResponse, SubscriptionStatsComparison, ComparisonMetrics } from './get-subscription-stats-compare.response';
import { GetSubscriptionStatsHandler } from '../get-subscription-stats/get-subscription-stats.handler';
import { GetSubscriptionStatsRequest } from '../get-subscription-stats/get-subscription-stats.request';

/**
 * Handler para comparar estadísticas de suscripciones entre dos períodos
 */
@Injectable()
export class GetSubscriptionStatsCompareHandler {
  constructor(private readonly getSubscriptionStatsHandler: GetSubscriptionStatsHandler) {}

  async execute(
    request: GetSubscriptionStatsCompareRequest,
  ): Promise<GetSubscriptionStatsCompareResponse> {
    // Validar fechas
    const currentStartDate = new Date(request.currentStartDate);
    const currentEndDate = new Date(request.currentEndDate);
    const previousStartDate = new Date(request.previousStartDate);
    const previousEndDate = new Date(request.previousEndDate);

    if (
      isNaN(currentStartDate.getTime()) ||
      isNaN(currentEndDate.getTime()) ||
      isNaN(previousStartDate.getTime()) ||
      isNaN(previousEndDate.getTime())
    ) {
      throw new BadRequestException('Invalid date format. Use ISO 8601 format.');
    }

    if (currentStartDate >= currentEndDate) {
      throw new BadRequestException('currentStartDate must be before currentEndDate');
    }

    if (previousStartDate >= previousEndDate) {
      throw new BadRequestException('previousStartDate must be before previousEndDate');
    }

    // Obtener estadísticas del período actual
    const currentStatsRequest = new GetSubscriptionStatsRequest();
    currentStatsRequest.startDate = request.currentStartDate;
    currentStatsRequest.endDate = request.currentEndDate;
    const currentStats = await this.getSubscriptionStatsHandler.execute(currentStatsRequest);

    // Obtener estadísticas del período anterior
    const previousStatsRequest = new GetSubscriptionStatsRequest();
    previousStatsRequest.startDate = request.previousStartDate;
    previousStatsRequest.endDate = request.previousEndDate;
    const previousStats = await this.getSubscriptionStatsHandler.execute(previousStatsRequest);

    // Calcular comparaciones
    const comparison = this.calculateComparison(currentStats, previousStats);

    return new GetSubscriptionStatsCompareResponse(currentStats, previousStats, comparison);
  }

  /**
   * Calcula las comparaciones entre dos períodos
   */
  private calculateComparison(
    current: any,
    previous: any,
  ): SubscriptionStatsComparison {
    const calculateComparison = (currentValue: number, previousValue: number): ComparisonMetrics => {
      const absolute = currentValue - previousValue;
      const percentage =
        previousValue !== 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
      return new ComparisonMetrics(absolute, percentage);
    };

    return new SubscriptionStatsComparison(
      calculateComparison(current.mrr, previous.mrr),
      calculateComparison(current.arr, previous.arr),
      calculateComparison(current.activeSubscriptions, previous.activeSubscriptions),
      calculateComparison(current.churnRate, previous.churnRate),
      calculateComparison(current.retentionRate, previous.retentionRate),
      calculateComparison(current.renewalRate, previous.renewalRate),
      calculateComparison(current.paymentSuccessRate, previous.paymentSuccessRate),
      calculateComparison(
        current.averageRevenuePerSubscription,
        previous.averageRevenuePerSubscription,
      ),
      calculateComparison(current.totalRevenue, previous.totalRevenue),
      calculateComparison(current.newSubscriptions, previous.newSubscriptions),
      calculateComparison(current.cancelledSubscriptions, previous.cancelledSubscriptions),
    );
  }
}

