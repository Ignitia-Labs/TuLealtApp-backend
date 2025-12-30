import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerSubscription, ICurrencyRepository } from '@libs/domain';
import { PartnerSubscriptionEntity, PartnerMapper } from '@libs/infrastructure';
import { UpdateSubscriptionRequest } from './update-subscription.request';
import { UpdateSubscriptionResponse } from './update-subscription.response';
import { SubscriptionEventHelper } from '../subscription-event.helper';

/**
 * Handler para el caso de uso de actualizar una suscripción
 */
@Injectable()
export class UpdateSubscriptionHandler {
  constructor(
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    @Inject('ICurrencyRepository')
    private readonly currencyRepository: ICurrencyRepository,
    private readonly subscriptionEventHelper: SubscriptionEventHelper,
  ) {}

  async execute(request: UpdateSubscriptionRequest): Promise<UpdateSubscriptionResponse> {
    const subscriptionEntity = await this.subscriptionRepository.findOne({
      where: { id: request.subscriptionId },
    });

    if (!subscriptionEntity) {
      throw new NotFoundException(`Subscription with ID ${request.subscriptionId} not found`);
    }

    const subscription = PartnerMapper.subscriptionToDomain(subscriptionEntity);

    // Validar currencyId si se proporciona
    let currencyId: number | null = request.currencyId ?? subscription.currencyId;
    let currencyCode: string = request.currency ?? subscription.currency;

    if (request.currencyId !== undefined) {
      if (request.currencyId !== null) {
        const currency = await this.currencyRepository.findById(request.currencyId);
        if (!currency) {
          throw new NotFoundException(`Currency with ID ${request.currencyId} not found`);
        }
        currencyId = currency.id;
        // Si se proporciona currencyId pero no currency, usar el código de la moneda encontrada
        if (!request.currency) {
          currencyCode = currency.code;
        }
      } else {
        currencyId = null;
      }
    } else if (request.currency && !request.currencyId) {
      // Si se proporciona currency pero no currencyId, intentar buscar por código
      const currency = await this.currencyRepository.findByCode(request.currency);
      if (currency) {
        currencyId = currency.id;
      }
    }

    // Actualizar campos si se proporcionan
    let updatedSubscription = subscription;
    const oldStatus = subscription.status;
    const oldPlanType = subscription.planType;

    if (request.status) {
      updatedSubscription = updatedSubscription.updateStatus(request.status);
    }

    if (request.planId || request.planType) {
      // Crear nueva suscripción con los valores actualizados
      updatedSubscription = PartnerSubscription.create(
        subscription.partnerId,
        request.planId ?? subscription.planId,
        request.planType ?? subscription.planType,
        subscription.startDate,
        request.renewalDate ? new Date(request.renewalDate) : subscription.renewalDate,
        request.billingFrequency ?? subscription.billingFrequency,
        request.billingAmount ?? subscription.billingAmount,
        currencyCode,
        currencyId,
        request.nextBillingDate ? new Date(request.nextBillingDate) : subscription.nextBillingDate,
        request.nextBillingAmount ?? subscription.nextBillingAmount,
        request.currentPeriodStart
          ? new Date(request.currentPeriodStart)
          : subscription.currentPeriodStart,
        request.currentPeriodEnd
          ? new Date(request.currentPeriodEnd)
          : subscription.currentPeriodEnd,
        subscription.includeTax,
        subscription.taxPercent,
        subscription.basePrice,
        subscription.taxAmount,
        subscription.totalPrice,
        request.status ?? subscription.status,
        subscription.trialEndDate,
        subscription.pausedAt,
        subscription.pauseReason,
        subscription.gracePeriodDays,
        subscription.retryAttempts,
        subscription.maxRetryAttempts,
        0, // creditBalance siempre es 0 - se calcula dinámicamente desde los pagos
        request.discountPercent ?? subscription.discountPercent,
        request.discountCode ?? subscription.discountCode,
        subscription.lastPaymentDate,
        subscription.lastPaymentAmount,
        subscription.paymentStatus,
        request.autoRenew ?? subscription.autoRenew,
        subscription.id,
      );
    } else {
      // Actualizar solo campos específicos
      if (request.renewalDate) {
        updatedSubscription = PartnerSubscription.create(
          subscription.partnerId,
          subscription.planId,
          subscription.planType,
          subscription.startDate,
          new Date(request.renewalDate),
          request.billingFrequency ?? subscription.billingFrequency,
          request.billingAmount ?? subscription.billingAmount,
          currencyCode,
          currencyId,
          request.nextBillingDate
            ? new Date(request.nextBillingDate)
            : subscription.nextBillingDate,
          request.nextBillingAmount ?? subscription.nextBillingAmount,
          request.currentPeriodStart
            ? new Date(request.currentPeriodStart)
            : subscription.currentPeriodStart,
          request.currentPeriodEnd
            ? new Date(request.currentPeriodEnd)
            : subscription.currentPeriodEnd,
          subscription.includeTax,
          subscription.taxPercent,
          subscription.basePrice,
          subscription.taxAmount,
          subscription.totalPrice,
          request.status ?? subscription.status,
          subscription.trialEndDate,
          subscription.pausedAt,
          subscription.pauseReason,
          subscription.gracePeriodDays,
          subscription.retryAttempts,
          subscription.maxRetryAttempts,
          0, // creditBalance siempre es 0 - se calcula dinámicamente desde los pagos
          request.discountPercent ?? subscription.discountPercent,
          request.discountCode ?? subscription.discountCode,
          subscription.lastPaymentDate,
          subscription.lastPaymentAmount,
          subscription.paymentStatus,
          request.autoRenew ?? subscription.autoRenew,
          subscription.id,
        );
      }
    }

    // Guardar cambios
    const updatedEntity = PartnerMapper.subscriptionToPersistence(updatedSubscription);
    const savedEntity = await this.subscriptionRepository.save(updatedEntity);
    const savedSubscription = PartnerMapper.subscriptionToDomain(savedEntity);

    // Registrar eventos según los cambios
    if (request.status && oldStatus !== savedSubscription.status) {
      const eventType = this.getStatusEventType(savedSubscription.status);
      if (eventType) {
        await this.subscriptionEventHelper.createEvent(savedSubscription, eventType);
      }
    }

    if ((request.planId || request.planType) && oldPlanType !== savedSubscription.planType) {
      // Determinar si es upgrade o downgrade comparando los precios
      const oldPrice = subscription.billingAmount || 0;
      const newPrice = savedSubscription.billingAmount || 0;

      let eventType: 'plan_upgraded' | 'plan_downgraded' | 'plan_changed' = 'plan_changed';

      if (newPrice > oldPrice) {
        eventType = 'plan_upgraded';
      } else if (newPrice < oldPrice) {
        eventType = 'plan_downgraded';
      }

      await this.subscriptionEventHelper.createEvent(savedSubscription, eventType, {
        oldPlanType,
        newPlanType: savedSubscription.planType,
        oldPlanId: subscription.planId,
        newPlanId: savedSubscription.planId,
        oldPrice,
        newPrice,
      });
    }

    if (request.status === 'paused' && !subscription.pausedAt) {
      await this.subscriptionEventHelper.createEvent(savedSubscription, 'paused', {
        reason: 'Suscripción pausada manualmente',
      });
    }

    if (oldStatus === 'paused' && request.status && request.status !== 'paused') {
      await this.subscriptionEventHelper.createEvent(savedSubscription, 'resumed');
    }

    return new UpdateSubscriptionResponse(
      savedEntity.id,
      savedEntity.status,
      savedEntity.updatedAt,
    );
  }

  /**
   * Obtiene el tipo de evento según el nuevo estado
   */
  private getStatusEventType(
    status: string,
  ): 'activated' | 'suspended' | 'cancelled' | 'expired' | null {
    const statusEventMap: Record<string, 'activated' | 'suspended' | 'cancelled' | 'expired'> = {
      active: 'activated',
      suspended: 'suspended',
      cancelled: 'cancelled',
      expired: 'expired',
    };

    return statusEventMap[status] || null;
  }
}
