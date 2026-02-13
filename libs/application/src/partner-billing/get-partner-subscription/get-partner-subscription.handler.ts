import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPartnerSubscriptionRepository, ICurrencyRepository } from '@libs/domain';
import { GetPartnerSubscriptionRequest } from './get-partner-subscription.request';
import { GetPartnerSubscriptionResponse } from './get-partner-subscription.response';

/**
 * Handler para obtener la información de la suscripción del partner
 */
@Injectable()
export class GetPartnerSubscriptionHandler {
  constructor(
    @Inject('IPartnerSubscriptionRepository')
    private readonly partnerSubscriptionRepository: IPartnerSubscriptionRepository,
    @Inject('ICurrencyRepository')
    private readonly currencyRepository: ICurrencyRepository,
  ) {}

  async execute(request: GetPartnerSubscriptionRequest): Promise<GetPartnerSubscriptionResponse> {
    // Obtener suscripción del partner
    const subscription = await this.partnerSubscriptionRepository.findByPartnerId(
      request.partnerId,
    );

    if (!subscription) {
      throw new NotFoundException(`Subscription not found for partner ${request.partnerId}`);
    }

    // Obtener información de la moneda
    const currency = await this.currencyRepository.findByCode(subscription.currency);
    const currencyId = currency?.id ?? null;
    const currencyLabel = currency?.name ?? null;

    // Calcular días hasta renovación
    const now = new Date();
    const daysUntilRenewal = Math.ceil(
      (subscription.renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Verificar si está en período de gracia
    // El período de gracia aplica cuando la suscripción está vencida pero aún no cancelada
    const isOverdue = subscription.renewalDate < now && subscription.status !== 'cancelled';
    const daysSinceRenewal = Math.floor(
      (now.getTime() - subscription.renewalDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const isInGracePeriod = isOverdue && daysSinceRenewal <= subscription.gracePeriodDays;

    return new GetPartnerSubscriptionResponse(
      subscription.id,
      subscription.partnerId,
      subscription.planId,
      subscription.planType,
      subscription.status,
      subscription.billingFrequency,
      subscription.billingAmount,
      subscription.basePrice,
      subscription.taxAmount,
      subscription.totalPrice,
      subscription.includeTax,
      subscription.taxPercent,
      subscription.currency,
      currencyId,
      currencyLabel,
      subscription.startDate,
      subscription.renewalDate,
      subscription.currentPeriodStart,
      subscription.currentPeriodEnd,
      subscription.nextBillingDate,
      subscription.nextBillingAmount,
      subscription.autoRenew,
      subscription.creditBalance,
      subscription.discountPercent,
      subscription.discountCode,
      subscription.lastPaymentDate,
      subscription.lastPaymentAmount,
      subscription.paymentStatus,
      subscription.trialEndDate,
      subscription.gracePeriodDays,
      daysUntilRenewal,
      isInGracePeriod,
      subscription.createdAt,
      subscription.updatedAt,
    );
  }
}
