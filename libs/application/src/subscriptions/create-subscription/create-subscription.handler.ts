import { Injectable, BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PartnerSubscription,
  IPartnerRepository,
  IPricingPlanRepository,
  ICurrencyRepository,
  IRateExchangeRepository,
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
    @Inject('IRateExchangeRepository')
    private readonly rateExchangeRepository: IRateExchangeRepository,
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

    // Convertir planId de string a number y obtener el plan completo
    let numericPlanId: number;
    let pricingPlan = null;

    const numericPlanIdParsed = parseInt(request.planId, 10);
    if (!isNaN(numericPlanIdParsed) && numericPlanIdParsed.toString() === request.planId.trim()) {
      // Ya es numérico
      numericPlanId = numericPlanIdParsed;
      pricingPlan = await this.pricingPlanRepository.findById(numericPlanId);
    } else {
      // Es un slug, buscar el plan
      pricingPlan = await this.pricingPlanRepository.findBySlug(request.planId);
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

    // Validar que se encontró el plan
    if (!pricingPlan) {
      throw new NotFoundException(
        `Pricing plan not found in database for ID or slug "${request.planId}"`,
      );
    }

    // Calcular valores de precio, conversión de moneda e impuestos
    let basePrice: number;
    let taxAmount: number;
    let totalPrice: number;

    // Si se proporcionan valores explícitos de precio, usarlos directamente
    if (
      request.basePrice !== undefined &&
      request.taxAmount !== undefined &&
      request.totalPrice !== undefined
    ) {
      basePrice = request.basePrice;
      taxAmount = request.taxAmount;
      totalPrice = request.totalPrice;
    } else {
      // Paso 1: Obtener el precio del plan en USD
      const usdPrice = pricingPlan.pricing?.[request.billingFrequency];
      if (usdPrice === undefined || usdPrice === null) {
        throw new BadRequestException(
          `No price found for billing frequency "${request.billingFrequency}" in plan "${pricingPlan.name}"`,
        );
      }

      // Paso 2: Determinar la moneda de destino
      let targetCurrency = null;
      if (currencyId) {
        targetCurrency = await this.currencyRepository.findById(currencyId);
        if (!targetCurrency) {
          throw new NotFoundException(`Currency with ID ${currencyId} not found`);
        }
      } else if (currencyCode) {
        targetCurrency = await this.currencyRepository.findByCode(currencyCode);
      }
      // Paso 3: Convertir de USD a la moneda de destino si es necesario
      if (targetCurrency && targetCurrency.code !== 'USD') {
        // Necesitamos convertir de USD a la moneda de destino
        const rateExchange = await this.rateExchangeRepository.getCurrent();

        if (!rateExchange) {
          throw new BadRequestException(
            `Exchange rate not found. Cannot convert from USD to ${targetCurrency.code}. Please configure the exchange rate first.`,
          );
        }

        // RateExchange almacena: rate GTQ por 1 USD
        // Para convertir USD a GTQ: usdAmount * rate
        // Si la moneda destino es GTQ
        if (targetCurrency.code === 'GTQ') {
          basePrice = usdPrice * rateExchange.rate;
        } else {
          // Si hay otras monedas en el futuro, aquí se agregarían sus conversiones
          throw new BadRequestException(
            `Currency conversion not supported for ${targetCurrency.code}. Only USD and GTQ are currently supported.`,
          );
        }

        // Redondear según los decimales de la moneda
        const decimals = targetCurrency.decimalPlaces ?? 2;
        basePrice = Math.round(basePrice * Math.pow(10, decimals)) / Math.pow(10, decimals);
      } else {
        // La moneda es USD o no hay conversión necesaria
        basePrice = usdPrice;
      }

      // Paso 4: Calcular impuestos si aplica
      taxAmount = 0;
      if (request.includeTax && request.taxPercent && request.taxPercent > 0) {
        taxAmount = basePrice * (request.taxPercent / 100);

        // Redondear el monto de impuestos
        const decimals = targetCurrency?.decimalPlaces ?? 2;
        taxAmount = Math.round(taxAmount * Math.pow(10, decimals)) / Math.pow(10, decimals);
      }

      // Paso 5: Calcular precio total
      totalPrice = basePrice + taxAmount;

      // Redondear el precio total
      const decimals = targetCurrency?.decimalPlaces ?? 2;
      totalPrice = Math.round(totalPrice * Math.pow(10, decimals)) / Math.pow(10, decimals);
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

    // Usar el plan ya obtenido anteriormente (evitar consulta duplicada)
    const planId = pricingPlan.id;
    const planSlug = pricingPlan.slug;

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
