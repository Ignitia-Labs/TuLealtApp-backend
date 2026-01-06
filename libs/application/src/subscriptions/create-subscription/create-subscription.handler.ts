import { Injectable, BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PartnerSubscription,
  IPartnerRepository,
  IPricingPlanRepository,
  ICurrencyRepository,
} from '@libs/domain';
import { PartnerSubscriptionEntity, PartnerMapper } from '@libs/infrastructure';
import { CreateSubscriptionRequest } from './create-subscription.request';
import { CreateSubscriptionResponse } from './create-subscription.response';
import { SubscriptionEventHelper } from '../subscription-event.helper';
import { SubscriptionUsageHelper } from '@libs/application';
import { PartnerSubscriptionUsageEntity } from '@libs/infrastructure';

/**
 * Handler para el caso de uso de crear una suscripción
 */
@Injectable()
export class CreateSubscriptionHandler {
  constructor(
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('IPricingPlanRepository')
    private readonly pricingPlanRepository: IPricingPlanRepository,
    @Inject('ICurrencyRepository')
    private readonly currencyRepository: ICurrencyRepository,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    @InjectRepository(PartnerSubscriptionUsageEntity)
    private readonly usageRepository: Repository<PartnerSubscriptionUsageEntity>,
    private readonly subscriptionEventHelper: SubscriptionEventHelper,
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

    // Validar currencyId si se proporciona
    let currencyId: number | null = request.currencyId ?? null;
    let currencyCode: string = request.currency;

    if (request.currencyId) {
      const currency = await this.currencyRepository.findById(request.currencyId);
      if (!currency) {
        throw new NotFoundException(`Currency with ID ${request.currencyId} not found`);
      }
      // Si se proporciona currencyId pero no currency, usar el código de la moneda encontrada
      if (!request.currency) {
        currencyCode = currency.code;
      }
      currencyId = currency.id;
    } else if (request.currency) {
      // Si se proporciona currency pero no currencyId, intentar buscar por código
      const currency = await this.currencyRepository.findByCode(request.currency);
      if (currency) {
        currencyId = currency.id;
      }
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
      currencyCode,
      currencyId,
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
      0, // creditBalance siempre es 0 - se calcula dinámicamente desde los pagos
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

    // Crear automáticamente el registro de uso de suscripción
    await SubscriptionUsageHelper.createUsageForSubscription(
      savedEntity.id,
      this.usageRepository,
    );

    // Registrar evento de creación
    const savedSubscription = PartnerMapper.subscriptionToDomain(savedEntity);
    await this.subscriptionEventHelper.createEvent(savedSubscription, 'created', {
      planType: savedSubscription.planType,
      billingAmount: savedSubscription.billingAmount,
      currency: savedSubscription.currency,
      billingFrequency: savedSubscription.billingFrequency,
    });

    // Buscar el plan de precios para obtener el ID numérico y el slug
    let planId: number = 0;
    let planSlug: string = savedEntity.planId; // Por defecto usar el planId como slug

    // Intentar buscar el plan por ID numérico primero
    const numericPlanId = parseInt(savedEntity.planId, 10);
    if (!isNaN(numericPlanId)) {
      const plan = await this.pricingPlanRepository.findById(numericPlanId);
      if (plan) {
        planId = plan.id;
        planSlug = plan.slug;
      }
    } else {
      // Si no es numérico, buscar por slug
      const plan = await this.pricingPlanRepository.findBySlug(savedEntity.planId);
      if (plan) {
        planId = plan.id;
        planSlug = plan.slug;
      } else {
        // Si no se encuentra, intentar buscar sin el prefijo "plan-"
        const slugWithoutPrefix = savedEntity.planId.replace(/^plan-/, '');
        const planBySlug = await this.pricingPlanRepository.findBySlug(slugWithoutPrefix);
        if (planBySlug) {
          planId = planBySlug.id;
          planSlug = planBySlug.slug;
        }
      }
    }

    return new CreateSubscriptionResponse(
      savedEntity.id,
      savedEntity.partnerId,
      planId,
      planSlug,
      savedEntity.planType,
      savedEntity.status,
      savedEntity.startDate,
      savedEntity.renewalDate,
      savedEntity.createdAt,
    );
  }
}
