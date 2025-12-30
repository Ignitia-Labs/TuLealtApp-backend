import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  PartnerSubscription,
  ISubscriptionEventRepository,
  IRateExchangeRepository,
} from '@libs/domain';
import {
  PartnerSubscriptionEntity,
  PartnerMapper,
  PaymentEntity,
  PaymentMapper,
} from '@libs/infrastructure';
import { GetSubscriptionTimeseriesRequest } from './get-subscription-timeseries.request';
import { GetSubscriptionTimeseriesResponse, PeriodMetrics } from './get-subscription-timeseries.response';
import { SubscriptionTimeseriesService } from './subscription-timeseries.service';
import { GetSubscriptionStatsHandler } from '../get-subscription-stats/get-subscription-stats.handler';
import { GetSubscriptionStatsRequest } from '../get-subscription-stats/get-subscription-stats.request';
import { Period } from '../get-subscription-stats/subscription-stats.service';

/**
 * Handler para obtener series temporales de estadísticas de suscripciones
 */
@Injectable()
export class GetSubscriptionTimeseriesHandler {
  constructor(
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentEntityRepository: Repository<PaymentEntity>,
    @Inject('ISubscriptionEventRepository')
    private readonly subscriptionEventRepository: ISubscriptionEventRepository,
    @Inject('IRateExchangeRepository')
    private readonly rateExchangeRepository: IRateExchangeRepository,
    private readonly timeseriesService: SubscriptionTimeseriesService,
    private readonly getSubscriptionStatsHandler: GetSubscriptionStatsHandler,
  ) {}

  async execute(
    request: GetSubscriptionTimeseriesRequest,
  ): Promise<GetSubscriptionTimeseriesResponse> {
    // Validar fechas
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use ISO 8601 format.');
    }

    if (startDate >= endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    // Validar que el período no exceda 2 años
    const twoYearsInMs = 2 * 365 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() > twoYearsInMs) {
      throw new BadRequestException('Period cannot exceed 2 years');
    }

    // Validar groupBy según el rango de fechas
    const periodDuration = endDate.getTime() - startDate.getTime();
    const days = Math.ceil(periodDuration / (1000 * 60 * 60 * 24));

    if (request.groupBy === 'day' && days > 365) {
      throw new BadRequestException('Cannot group by day for periods longer than 365 days');
    }

    if (request.groupBy === 'week' && days > 730) {
      throw new BadRequestException('Cannot group by week for periods longer than 730 days');
    }

    const period: Period = { startDate, endDate };

    // Obtener suscripciones en el período
    const subscriptionEntities = await this.subscriptionRepository.find({
      where: [
        {
          createdAt: Between(startDate, endDate),
        },
        {
          createdAt: Between(new Date(0), startDate),
        },
      ],
    });

    const subscriptions = subscriptionEntities
      .map((entity) => PartnerMapper.subscriptionToDomain(entity))
      .filter(
        (sub) =>
          (sub.startDate <= endDate && (sub.renewalDate >= startDate || !sub.renewalDate)) ||
          (sub.createdAt >= startDate && sub.createdAt <= endDate),
      );

    // Obtener pagos en el período
    const paymentEntities = await this.paymentEntityRepository.find({
      where: {
        paymentDate: Between(startDate, endDate),
      },
    });
    const payments = paymentEntities.map((entity) => PaymentMapper.toDomain(entity));

    // Obtener eventos en el período
    const allEvents = await this.subscriptionEventRepository.findByDateRange(
      startDate,
      endDate,
      undefined,
      0,
      10000,
    );

    // Obtener exchange rate actual
    const exchangeRate = await this.rateExchangeRepository.getCurrent();

    // Generar series temporales
    const series = this.timeseriesService.groupByPeriod(
      subscriptions,
      payments,
      allEvents,
      startDate,
      endDate,
      request.groupBy,
      exchangeRate,
    );

    // Obtener estadísticas agregadas del período completo
    const statsRequest = new GetSubscriptionStatsRequest();
    statsRequest.startDate = request.startDate;
    statsRequest.endDate = request.endDate;
    const summary = await this.getSubscriptionStatsHandler.execute(statsRequest);

    // Convertir series a DTOs
    const seriesMetrics: PeriodMetrics[] = series.map((item) => ({
      period: item.period,
      mrr: item.mrr,
      arr: item.arr,
      activeSubscriptions: item.activeSubscriptions,
      totalSubscriptions: item.totalSubscriptions,
      churnRate: item.churnRate,
      retentionRate: item.retentionRate,
      renewalRate: item.renewalRate,
      paymentSuccessRate: item.paymentSuccessRate,
      totalRevenue: item.totalRevenue,
      newSubscriptions: item.newSubscriptions,
      cancelledSubscriptions: item.cancelledSubscriptions,
      upgrades: item.upgrades,
      downgrades: item.downgrades,
      startDate: item.startDate,
      endDate: item.endDate,
    }));

    return new GetSubscriptionTimeseriesResponse(seriesMetrics, summary, series.length);
  }
}

