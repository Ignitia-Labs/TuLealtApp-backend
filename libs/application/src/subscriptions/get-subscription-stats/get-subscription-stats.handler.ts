import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  PartnerSubscription,
  ISubscriptionEventRepository,
  IPaymentRepository,
  IRateExchangeRepository,
} from '@libs/domain';
import {
  PartnerSubscriptionEntity,
  PartnerMapper,
  PaymentEntity,
  PaymentMapper,
} from '@libs/infrastructure';
import { GetSubscriptionStatsRequest } from './get-subscription-stats.request';
import { SubscriptionStatsResponse } from './get-subscription-stats.response';
import { SubscriptionStatsService, Period } from './subscription-stats.service';

/**
 * Handler para obtener estadísticas de suscripciones
 */
@Injectable()
export class GetSubscriptionStatsHandler {
  constructor(
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentEntityRepository: Repository<PaymentEntity>,
    @Inject('ISubscriptionEventRepository')
    private readonly subscriptionEventRepository: ISubscriptionEventRepository,
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    @Inject('IRateExchangeRepository')
    private readonly rateExchangeRepository: IRateExchangeRepository,
    private readonly statsService: SubscriptionStatsService,
  ) {}

  async execute(request: GetSubscriptionStatsRequest): Promise<SubscriptionStatsResponse> {
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

    const period: Period = { startDate, endDate };

    // Obtener suscripciones en el período
    // Incluimos todas las suscripciones que existieron en algún momento del período
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

    // Filtrar suscripciones que existieron durante el período
    const subscriptions = subscriptionEntities
      .map((entity) => PartnerMapper.subscriptionToDomain(entity))
      .filter(
        (sub) =>
          (sub.startDate <= endDate && (sub.renewalDate >= startDate || !sub.renewalDate)) ||
          (sub.createdAt >= startDate && sub.createdAt <= endDate),
      );

    // Obtener pagos en el período
    // Usamos el repositorio de entidades directamente ya que no hay método findByDateRange en el repositorio de dominio
    const paymentEntities = await this.paymentEntityRepository.find({
      where: {
        paymentDate: Between(startDate, endDate),
      },
    });
    const payments = paymentEntities.map((entity) => PaymentMapper.toDomain(entity));

    // Obtener eventos en el período usando el método extendido del repositorio
    const allEvents = await this.subscriptionEventRepository.findByDateRange(
      startDate,
      endDate,
      undefined,
      0,
      10000, // Límite alto para obtener todos los eventos del período
    );

    // Obtener exchange rate actual
    const exchangeRate = await this.rateExchangeRepository.getCurrent();

    // Calcular estadísticas
    const stats = this.statsService.calculateStats(
      subscriptions,
      payments,
      allEvents,
      period,
      exchangeRate,
    );

    // Construir respuesta
    return new SubscriptionStatsResponse(
      stats.mrr,
      stats.arr,
      stats.activeSubscriptions,
      stats.totalSubscriptions,
      stats.churnRate,
      stats.retentionRate,
      stats.renewalRate,
      stats.paymentSuccessRate,
      stats.averageRevenuePerSubscription,
      stats.totalRevenue,
      stats.newSubscriptions,
      stats.cancelledSubscriptions,
      stats.upgrades,
      stats.downgrades,
      stats.byPlanType,
      stats.byCurrency,
    );
  }
}
