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

    // Buscar el plan de precios para obtener el ID numérico y el slug
    let planId: number = 0;
    let planSlug: string = subscription.planId; // Por defecto usar el planId como slug

    // Intentar buscar el plan por ID numérico primero
    const numericPlanId = parseInt(subscription.planId, 10);
    if (!isNaN(numericPlanId)) {
      const plan = await this.pricingPlanRepository.findById(numericPlanId);
      if (plan) {
        planId = plan.id;
        planSlug = plan.slug;
      }
    } else {
      // Si no es numérico, buscar por slug
      const plan = await this.pricingPlanRepository.findBySlug(subscription.planId);
      if (plan) {
        planId = plan.id;
        planSlug = plan.slug;
      } else {
        // Si no se encuentra, intentar buscar sin el prefijo "plan-"
        const slugWithoutPrefix = subscription.planId.replace(/^plan-/, '');
        const planBySlug = await this.pricingPlanRepository.findBySlug(slugWithoutPrefix);
        if (planBySlug) {
          planId = planBySlug.id;
          planSlug = planBySlug.slug;
        }
      }
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

