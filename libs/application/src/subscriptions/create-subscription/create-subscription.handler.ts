import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerSubscription, IPartnerRepository } from '@libs/domain';
import { PartnerSubscriptionEntity, PartnerMapper } from '@libs/infrastructure';
import { CreateSubscriptionRequest } from './create-subscription.request';
import { CreateSubscriptionResponse } from './create-subscription.response';

/**
 * Handler para el caso de uso de crear una suscripción
 */
@Injectable()
export class CreateSubscriptionHandler {
  constructor(
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
  ) {}

  async execute(request: CreateSubscriptionRequest): Promise<CreateSubscriptionResponse> {
    // Validar que el partner existe
    const partner = await this.partnerRepository.findById(request.partnerId);
    if (!partner) {
      throw new BadRequestException(`Partner with ID ${request.partnerId} not found`);
    }

    // Verificar si el partner ya tiene una suscripción activa
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: { partnerId: request.partnerId, status: 'active' },
    });

    if (existingSubscription) {
      throw new BadRequestException('Partner already has an active subscription');
    }

    // Calcular valores de impuestos si no se proporcionan
    let basePrice = request.basePrice ?? request.billingAmount;
    let taxAmount = request.taxAmount ?? 0;
    let totalPrice = request.totalPrice ?? request.billingAmount;

    if (request.includeTax && request.taxPercent && request.taxPercent > 0) {
      basePrice = request.billingAmount;
      taxAmount = basePrice * (request.taxPercent / 100);
      totalPrice = basePrice + taxAmount;
    }

    // Crear la entidad de dominio
    const subscription = PartnerSubscription.create(
      request.partnerId,
      request.planId,
      request.planType,
      new Date(request.startDate),
      new Date(request.renewalDate),
      request.billingFrequency,
      request.billingAmount,
      request.currency,
      new Date(request.nextBillingDate),
      request.nextBillingAmount,
      new Date(request.currentPeriodStart),
      new Date(request.currentPeriodEnd),
      request.includeTax ?? false,
      request.taxPercent ?? null,
      basePrice,
      taxAmount,
      totalPrice,
      request.status ?? 'active',
      request.trialEndDate ? new Date(request.trialEndDate) : null,
      null,
      null,
      request.gracePeriodDays ?? 7,
      request.retryAttempts ?? 0,
      request.maxRetryAttempts ?? 3,
      request.creditBalance ?? 0,
      request.discountPercent ?? null,
      request.discountCode ?? null,
      null,
      null,
      null,
      request.autoRenew ?? true,
    );

    // Convertir a entidad de persistencia y guardar
    const subscriptionEntity = PartnerMapper.subscriptionToPersistence(subscription);
    const savedEntity = await this.subscriptionRepository.save(subscriptionEntity);

    return new CreateSubscriptionResponse(
      savedEntity.id,
      savedEntity.partnerId,
      savedEntity.planId,
      savedEntity.planType,
      savedEntity.status,
      savedEntity.startDate,
      savedEntity.renewalDate,
      savedEntity.createdAt,
    );
  }
}

