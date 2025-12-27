import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerSubscription } from '@libs/domain';
import { PartnerSubscriptionEntity, PartnerMapper } from '@libs/infrastructure';
import { UpdateSubscriptionRequest } from './update-subscription.request';
import { UpdateSubscriptionResponse } from './update-subscription.response';

/**
 * Handler para el caso de uso de actualizar una suscripción
 */
@Injectable()
export class UpdateSubscriptionHandler {
  constructor(
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
  ) {}

  async execute(request: UpdateSubscriptionRequest): Promise<UpdateSubscriptionResponse> {
    const subscriptionEntity = await this.subscriptionRepository.findOne({
      where: { id: request.subscriptionId },
    });

    if (!subscriptionEntity) {
      throw new NotFoundException(`Subscription with ID ${request.subscriptionId} not found`);
    }

    const subscription = PartnerMapper.subscriptionToDomain(subscriptionEntity);

    // Actualizar campos si se proporcionan
    let updatedSubscription = subscription;

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
        subscription.currency,
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
        request.creditBalance ?? subscription.creditBalance,
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
          subscription.currency,
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
          request.creditBalance ?? subscription.creditBalance,
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

    return new UpdateSubscriptionResponse(
      savedEntity.id,
      savedEntity.status,
      savedEntity.updatedAt,
    );
  }
}

