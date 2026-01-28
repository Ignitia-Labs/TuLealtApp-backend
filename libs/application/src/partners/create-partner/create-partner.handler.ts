import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  IPartnerRepository,
  ICurrencyRepository,
  IPricingPlanRepository,
  ICountryRepository,
  Partner,
  PartnerSubscription,
  PartnerLimits,
  SubscriptionStatus,
  BillingFrequency,
} from '@libs/domain';
import { CreatePartnerRequest } from './create-partner.request';
import { CreatePartnerResponse } from './create-partner.response';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PartnerSubscriptionEntity,
  PartnerLimitsEntity,
  PartnerEntity,
} from '@libs/infrastructure';
import { PartnerMapper } from '@libs/infrastructure';
import { getPriceForPeriod, calculateFinalPrice } from '@libs/shared';
import { SubscriptionUsageHelper } from '@libs/application';
import { PartnerSubscriptionUsageEntity } from '@libs/infrastructure';

/**
 * Handler para el caso de uso de crear un partner
 * Implementa la lógica de negocio para registrar un nuevo partner
 */
@Injectable()
export class CreatePartnerHandler {
  constructor(
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('ICurrencyRepository')
    private readonly currencyRepository: ICurrencyRepository,
    @Inject('IPricingPlanRepository')
    private readonly pricingPlanRepository: IPricingPlanRepository,
    @Inject('ICountryRepository')
    private readonly countryRepository: ICountryRepository,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    @InjectRepository(PartnerLimitsEntity)
    private readonly limitsRepository: Repository<PartnerLimitsEntity>,
    @InjectRepository(PartnerEntity)
    private readonly partnerEntityRepository: Repository<PartnerEntity>,
    @InjectRepository(PartnerSubscriptionUsageEntity)
    private readonly usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ) {}

  async execute(request: CreatePartnerRequest): Promise<CreatePartnerResponse> {
    // Validar que el email no exista
    const existingPartnerByEmail = await this.partnerRepository.findByEmail(request.email);
    if (existingPartnerByEmail) {
      throw new BadRequestException('Partner with this email already exists');
    }

    // Validar que el dominio no exista
    const existingPartnerByDomain = await this.partnerRepository.findByDomain(request.domain);
    if (existingPartnerByDomain) {
      throw new BadRequestException('Partner with this domain already exists');
    }

    // Crear la entidad de dominio del partner sin ID (la BD lo generará automáticamente)
    const partner = Partner.create(
      request.name,
      request.responsibleName,
      request.email,
      request.phone,
      request.countryId || null,
      request.city,
      request.plan,
      request.category,
      request.rewardType,
      request.currencyId,
      request.businessName,
      request.taxId,
      request.fiscalAddress,
      request.paymentMethod,
      request.billingEmail,
      request.domain,
      request.logo || null,
      request.banner || null,
      request.branchesNumber || 0,
      request.website || null,
      request.socialMedia || null,
      'active',
    );

    // Consultar el nombre del país si se proporciona countryId
    let countryName: string | null = null;
    if (partner.countryId) {
      const country = await this.countryRepository.findById(partner.countryId);
      if (country) {
        countryName = country.name;
      }
    }

    // Convertir a entidad de persistencia con el nombre del país
    const partnerEntity = PartnerMapper.toPersistence(partner, countryName);

    // Guardar el partner usando el repositorio de TypeORM directamente
    const savedEntity = await this.partnerEntityRepository.save(partnerEntity);

    // Convertir de vuelta a dominio
    const savedPartner = PartnerMapper.toDomain(savedEntity);

    // Determinar planType basado en el plan del partner
    const planTypeMap: Record<string, 'esencia' | 'conecta' | 'inspira'> = {
      esencia: 'esencia',
      conecta: 'conecta',
      inspira: 'inspira',
    };
    const planType = planTypeMap[savedPartner.plan] || 'conecta';

    // Determinar la moneda de la suscripción
    // Si se proporciona subscriptionCurrencyId, usarlo; de lo contrario, usar el currencyId del partner
    const subscriptionCurrencyId = request.subscriptionCurrencyId ?? request.currencyId;

    // Buscar la currency de la suscripción en la base de datos
    const subscriptionCurrency = await this.currencyRepository.findById(subscriptionCurrencyId);
    if (!subscriptionCurrency) {
      throw new NotFoundException(
        `Currency with ID ${subscriptionCurrencyId} not found for subscription`,
      );
    }

    // Usar el código de la currency de la suscripción (ej: 'GTQ', 'USD')
    const currencyCode = subscriptionCurrency.code;

    const billingFrequency = request.subscriptionBillingFrequency || 'monthly'; // Usar el del request o 'monthly' por defecto

    // Obtener el plan de precios para obtener trialDays y precio
    let pricingPlan = null;

    // Intentar buscar por ID numérico primero
    const numericPlanId = parseInt(request.subscriptionPlanId, 10);
    if (!isNaN(numericPlanId)) {
      pricingPlan = await this.pricingPlanRepository.findById(numericPlanId);
    }

    // Si no se encontró por ID, buscar por slug
    if (!pricingPlan) {
      pricingPlan = await this.pricingPlanRepository.findBySlug(request.subscriptionPlanId);
    }

    // Si aún no se encontró, intentar sin el prefijo "plan-"
    if (!pricingPlan) {
      const slugWithoutPrefix = request.subscriptionPlanId.replace(/^plan-/, '');
      pricingPlan = await this.pricingPlanRepository.findBySlug(slugWithoutPrefix);
    }

    // Obtener el precio del plan si no se proporciona subscriptionLastPaymentAmount
    let billingAmount: number;
    if (
      request.subscriptionLastPaymentAmount !== undefined &&
      request.subscriptionLastPaymentAmount !== null
    ) {
      // Usar el valor proporcionado
      billingAmount = request.subscriptionLastPaymentAmount;
    } else {
      if (pricingPlan) {
        // Obtener el precio final del plan para la frecuencia de facturación (incluye descuentos si aplican)
        const finalPrice = calculateFinalPrice(pricingPlan, billingFrequency);
        if (finalPrice !== null) {
          billingAmount = finalPrice;
        } else {
          // Si no hay precio para esa frecuencia, usar el precio base mensual
          const monthlyPrice = getPriceForPeriod(pricingPlan, 'monthly');
          if (monthlyPrice !== null) {
            billingAmount = monthlyPrice;
          } else {
            // Si no hay precio mensual, usar 0 como fallback
            billingAmount = 0;
          }
        }
      } else {
        // Si no se encuentra el plan, usar 0 como fallback
        billingAmount = 0;
      }
    }

    // Obtener días de prueba: usar el del request si se proporciona, sino el del plan
    const trialDays =
      request.subscriptionTrialDays !== undefined && request.subscriptionTrialDays !== null
        ? request.subscriptionTrialDays
        : (pricingPlan?.trialDays ?? 0);

    // Calcular fechas considerando los días de prueba gratuita
    const registrationDate = request.subscriptionStartDate
      ? new Date(request.subscriptionStartDate)
      : new Date();

    const subscriptionDates = this.calculateSubscriptionDates(
      registrationDate,
      trialDays,
      billingFrequency,
      request.subscriptionRenewalDate ? new Date(request.subscriptionRenewalDate) : null,
    );

    const { trialEndDate, startDate, renewalDate, status, currentPeriodStart, currentPeriodEnd } =
      subscriptionDates;

    // Calcular valores de IVA
    // Si se proporcionan directamente basePrice, taxAmount y totalPrice, usarlos
    // Si no, calcularlos basándose en billingAmount, includeTax y taxPercent
    let basePrice: number;
    let taxAmount: number;
    let totalPrice: number;
    const includeTax = request.subscriptionIncludeTax ?? false;
    const taxPercent = request.subscriptionTaxPercent ?? null;

    if (
      request.subscriptionBasePrice !== undefined &&
      request.subscriptionTaxAmount !== undefined &&
      request.subscriptionTotalPrice !== undefined
    ) {
      // Usar valores proporcionados directamente
      basePrice = request.subscriptionBasePrice;
      taxAmount = request.subscriptionTaxAmount;
      totalPrice = request.subscriptionTotalPrice;
    } else {
      // Calcular valores basándose en billingAmount
      basePrice = billingAmount;
      taxAmount = 0;
      totalPrice = basePrice;

      if (includeTax && taxPercent !== null && taxPercent > 0) {
        taxAmount = basePrice * (taxPercent / 100);
        totalPrice = basePrice + taxAmount;
      }
    }

    // Crear y guardar la suscripción
    const subscription = PartnerSubscription.create(
      savedPartner.id,
      request.subscriptionPlanId,
      planType,
      startDate,
      renewalDate,
      billingFrequency,
      billingAmount,
      currencyCode,
      subscriptionCurrencyId, // currencyId de la suscripción (puede ser diferente del partner)
      renewalDate, // nextBillingDate = renewalDate por defecto
      totalPrice, // nextBillingAmount = totalPrice (incluye IVA si aplica)
      currentPeriodStart, // currentPeriodStart calculado según días de prueba
      currentPeriodEnd, // currentPeriodEnd calculado según días de prueba
      includeTax,
      taxPercent,
      basePrice,
      taxAmount,
      totalPrice,
      status, // status: 'trialing' si hay días de prueba, 'active' si no
      trialEndDate, // trialEndDate calculado según días de prueba
      null, // pausedAt
      null, // pauseReason
      7, // gracePeriodDays
      0, // retryAttempts
      3, // maxRetryAttempts
      0, // creditBalance
      null, // discountPercent
      null, // discountCode
      null, // lastPaymentDate
      request.subscriptionLastPaymentAmount || null,
      null, // paymentStatus
      request.subscriptionAutoRenew !== undefined ? request.subscriptionAutoRenew : true,
    );
    const subscriptionEntity = PartnerMapper.subscriptionToPersistence(subscription);
    subscriptionEntity.partnerId = savedPartner.id;
    const savedSubscriptionEntity = await this.subscriptionRepository.save(subscriptionEntity);

    // Crear automáticamente el registro de uso de suscripción
    await SubscriptionUsageHelper.createUsageForSubscription(
      savedSubscriptionEntity.id,
      this.usageRepository,
    );

    // Crear y guardar los límites
    const limits = PartnerLimits.create(
      savedPartner.id,
      request.limitsMaxTenants,
      request.limitsMaxBranches,
      request.limitsMaxCustomers,
      request.limitsMaxRewards,
      request.limitsMaxAdmins ?? -1,
      request.limitsStorageGB ?? -1,
      request.limitsApiCallsPerMonth ?? -1,
    );
    const limitsEntity = PartnerMapper.limitsToPersistence(limits);
    limitsEntity.partnerId = savedPartner.id;
    await this.limitsRepository.save(limitsEntity);

    // Nota: Las estadísticas se crean automáticamente cuando se crea la suscripción
    // a través de SubscriptionUsageHelper.createUsageForSubscription

    // Retornar response DTO
    return new CreatePartnerResponse(
      savedPartner.id,
      savedPartner.name,
      savedPartner.email,
      savedPartner.domain,
      savedPartner.plan,
      savedPartner.status,
      savedPartner.createdAt,
    );
  }

  /**
   * Calcula las fechas de la suscripción considerando los días de prueba gratuita
   * @param registrationDate Fecha de registro del partner
   * @param trialDays Días de prueba gratuita del plan
   * @param billingFrequency Frecuencia de facturación
   * @param providedRenewalDate Fecha de renovación proporcionada manualmente (opcional)
   * @returns Objeto con las fechas calculadas y el estado inicial
   */
  private calculateSubscriptionDates(
    registrationDate: Date,
    trialDays: number,
    billingFrequency: BillingFrequency,
    providedRenewalDate: Date | null,
  ): {
    trialEndDate: Date | null;
    startDate: Date;
    renewalDate: Date;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  } {
    // Normalizar la fecha de registro (inicio del día)
    const normalizedRegistrationDate = new Date(registrationDate);
    normalizedRegistrationDate.setHours(0, 0, 0, 0);

    // Si hay días de prueba, calcular fechas considerando el período de prueba
    if (trialDays > 0) {
      // Calcular fecha de fin del período de prueba
      // Sumar trialDays días a la fecha de registro usando milisegundos para evitar problemas con setDate
      const trialEndDate = new Date(
        normalizedRegistrationDate.getTime() + trialDays * 24 * 60 * 60 * 1000,
      );
      // Establecer al final del día (23:59:59.999)
      trialEndDate.setHours(23, 59, 59, 999);

      // La suscripción comienza el día siguiente al fin del período de prueba
      const startDate = new Date(trialEndDate.getTime() + 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);

      // Calcular fecha de renovación desde startDate (no desde registrationDate)
      // Si se proporciona una fecha de renovación manual, validar que sea posterior a startDate
      let renewalDate: Date;
      if (providedRenewalDate) {
        const providedDate = new Date(providedRenewalDate);
        // Si la fecha proporcionada es anterior o igual a startDate, calcularla automáticamente
        if (providedDate <= startDate) {
          renewalDate = this.calculateRenewalDate(startDate, billingFrequency);
        } else {
          renewalDate = providedDate;
        }
      } else {
        renewalDate = this.calculateRenewalDate(startDate, billingFrequency);
      }

      return {
        trialEndDate,
        startDate,
        renewalDate,
        status: 'trialing' as SubscriptionStatus,
        currentPeriodStart: startDate,
        currentPeriodEnd: renewalDate,
      };
    } else {
      // Sin días de prueba: la suscripción comienza inmediatamente
      const startDate = normalizedRegistrationDate;

      // Calcular fecha de renovación
      const renewalDate = providedRenewalDate
        ? new Date(providedRenewalDate)
        : this.calculateRenewalDate(startDate, billingFrequency);

      return {
        trialEndDate: null,
        startDate,
        renewalDate,
        status: 'active' as SubscriptionStatus,
        currentPeriodStart: startDate,
        currentPeriodEnd: renewalDate,
      };
    }
  }

  /**
   * Calcula la fecha de renovación según la frecuencia de facturación
   * @param startDate Fecha de inicio del período
   * @param billingFrequency Frecuencia de facturación
   * @returns Fecha de renovación calculada
   */
  private calculateRenewalDate(startDate: Date, billingFrequency: BillingFrequency): Date {
    const renewalDate = new Date(startDate);

    switch (billingFrequency) {
      case 'monthly':
        renewalDate.setMonth(renewalDate.getMonth() + 1);
        break;
      case 'quarterly':
        renewalDate.setMonth(renewalDate.getMonth() + 3);
        break;
      case 'semiannual':
        renewalDate.setMonth(renewalDate.getMonth() + 6);
        break;
      case 'annual':
        renewalDate.setFullYear(renewalDate.getFullYear() + 1);
        break;
      default:
        // Por defecto, mensual
        renewalDate.setMonth(renewalDate.getMonth() + 1);
    }

    // Establecer hora al final del día
    renewalDate.setHours(23, 59, 59, 999);

    return renewalDate;
  }
}
