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

    // Convertir planId de string a number
    let numericPlanId: number;
    const numericPlanIdParsed = parseInt(request.planId, 10);
    if (!isNaN(numericPlanIdParsed) && numericPlanIdParsed.toString() === request.planId.trim()) {
      // Ya es numérico
      numericPlanId = numericPlanIdParsed;
    } else {
      // Es un slug, buscar el plan
      let pricingPlan = await this.pricingPlanRepository.findBySlug(request.planId);
      if (!pricingPlan) {
        // Intentar sin prefijo "plan-"
        const slugWithoutPrefix = request.planId.replace(/^plan-/, '');
        pricingPlan = await this.pricingPlanRepository.findBySlug(slugWithoutPrefix);
      }
      if (!pricingPlan) {
        throw new NotFoundException(`Pricing plan with ID or slug "${request.planId}" not found`);
      }
      numericPlanId = pricingPlan.id;
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
      numericPlanId,
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
    await SubscriptionUsageHelper.createUsageForSubscription(savedEntity.id, this.usageRepository);

    // Registrar evento de creación
    const savedSubscription = PartnerMapper.subscriptionToDomain(savedEntity);
    await this.subscriptionEventHelper.createEvent(savedSubscription, 'created', {
      planType: savedSubscription.planType,
      billingAmount: savedSubscription.billingAmount,
      currency: savedSubscription.currency,
      billingFrequency: savedSubscription.billingFrequency,
    });

    // Obtener el plan de precios para obtener el slug (planId ya es numérico)
    const plan = await this.pricingPlanRepository.findById(savedEntity.planId);
    const planId = plan?.id ?? savedEntity.planId;
    const planSlug = plan?.slug ?? 'unknown';

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
