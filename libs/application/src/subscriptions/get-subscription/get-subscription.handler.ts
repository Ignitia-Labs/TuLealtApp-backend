import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerSubscription, IPricingPlanRepository } from '@libs/domain';
import { PartnerSubscriptionEntity, PartnerMapper } from '@libs/infrastructure';
import { CreditBalanceService } from '../credit-balance.service';
import { GetSubscriptionRequest } from './get-subscription.request';
import { GetSubscriptionResponse } from './get-subscription.response';

/**
 * Handler para el caso de uso de obtener una suscripción por ID
 */
@Injectable()
export class GetSubscriptionHandler {
  constructor(
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    @Inject('IPricingPlanRepository')
    private readonly pricingPlanRepository: IPricingPlanRepository,
    private readonly creditBalanceService: CreditBalanceService,
  ) {}

  async execute(request: GetSubscriptionRequest): Promise<GetSubscriptionResponse> {
    const subscriptionEntity = await this.subscriptionRepository.findOne({
      where: { id: request.subscriptionId },
    });

    if (!subscriptionEntity) {
      throw new NotFoundException(`Subscription with ID ${request.subscriptionId} not found`);
    }

    const subscription = PartnerMapper.subscriptionToDomain(subscriptionEntity);

    // Calcular crédito disponible dinámicamente desde los pagos reales
    const calculatedCreditBalance = await this.creditBalanceService.calculateAvailableCreditBalance(
      subscription.id,
      subscription.currency,
    );

    // Optimizado: Buscar el plan de precios intentando todas las variantes en paralelo
    let planId: number = 0;
    let planSlug: string = subscription.planId; // Por defecto usar el planId como slug

    const numericPlanId = parseInt(subscription.planId, 10);
    const slugWithoutPrefix = subscription.planId.replace(/^plan-/, '');

    // Intentar todas las búsquedas posibles en paralelo
    const planPromises = [
      // Si es numérico, buscar por ID
      !isNaN(numericPlanId)
        ? this.pricingPlanRepository.findById(numericPlanId)
        : Promise.resolve(null),
      // Buscar por slug original
      this.pricingPlanRepository.findBySlug(subscription.planId),
      // Buscar por slug sin prefijo (solo si es diferente)
      slugWithoutPrefix !== subscription.planId
        ? this.pricingPlanRepository.findBySlug(slugWithoutPrefix)
        : Promise.resolve(null),
    ];

    const [planById, planBySlug, planBySlugNoPrefix] = await Promise.all(planPromises);

    // Usar el primer plan encontrado (prioridad: ID > slug original > slug sin prefijo)
    const plan = planById || planBySlug || planBySlugNoPrefix;
    if (plan) {
      planId = plan.id;
      planSlug = plan.slug;
    }

    return new GetSubscriptionResponse(
      subscription.id,
      subscription.partnerId,
      planId,
      planSlug,
      subscription.planType,
      subscription.status,
      subscription.startDate,
      subscription.renewalDate,
      subscription.billingFrequency,
      subscription.billingAmount,
      subscription.includeTax,
      subscription.taxPercent,
      subscription.basePrice,
      subscription.taxAmount,
      subscription.totalPrice,
      subscription.currency,
      subscription.currencyId,
      subscription.nextBillingDate,
      subscription.nextBillingAmount,
      subscription.currentPeriodStart,
      subscription.currentPeriodEnd,
      subscription.trialEndDate,
      subscription.pausedAt,
      subscription.pauseReason,
      subscription.gracePeriodDays,
      subscription.retryAttempts,
      subscription.maxRetryAttempts,
      calculatedCreditBalance, // Usar crédito calculado dinámicamente
      subscription.discountPercent,
      subscription.discountCode,
      subscription.lastPaymentDate,
      subscription.lastPaymentAmount,
      subscription.paymentStatus,
      subscription.autoRenew,
      subscription.createdAt,
      subscription.updatedAt,
    );
  }
}
