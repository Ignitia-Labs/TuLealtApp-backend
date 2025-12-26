import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  IPartnerRepository,
  Partner,
  PartnerSubscription,
  PartnerLimits,
  PartnerStats,
} from '@libs/domain';
import { CreatePartnerRequest } from './create-partner.request';
import { CreatePartnerResponse } from './create-partner.response';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PartnerSubscriptionEntity,
  PartnerLimitsEntity,
  PartnerStatsEntity,
} from '@libs/infrastructure';
import { PartnerMapper } from '@libs/infrastructure';

/**
 * Handler para el caso de uso de crear un partner
 * Implementa la lógica de negocio para registrar un nuevo partner
 */
@Injectable()
export class CreatePartnerHandler {
  constructor(
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    @InjectRepository(PartnerLimitsEntity)
    private readonly limitsRepository: Repository<PartnerLimitsEntity>,
    @InjectRepository(PartnerStatsEntity)
    private readonly statsRepository: Repository<PartnerStatsEntity>,
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
      request.branchesNumber || 0,
      request.website || null,
      request.socialMedia || null,
      'active',
    );

    // Guardar el partner (la BD asignará el ID automáticamente)
    const savedPartner = await this.partnerRepository.save(partner);

    // Determinar planType basado en el plan del partner
    const planTypeMap: Record<string, 'esencia' | 'conecta' | 'inspira'> = {
      esencia: 'esencia',
      conecta: 'conecta',
      inspira: 'inspira',
    };
    const planType = planTypeMap[savedPartner.plan] || 'conecta';

    // Calcular fechas y montos por defecto
    const startDate = new Date(request.subscriptionStartDate);
    const renewalDate = new Date(request.subscriptionRenewalDate);
    const billingFrequency = 'monthly'; // Por defecto mensual
    const billingAmount = request.subscriptionLastPaymentAmount || 0;
    const currency = 'USD'; // Por defecto USD

    // Crear y guardar la suscripción
    const subscription = PartnerSubscription.create(
      savedPartner.id,
      request.subscriptionPlanId,
      planType,
      startDate,
      renewalDate,
      billingFrequency,
      billingAmount,
      currency,
      renewalDate, // nextBillingDate = renewalDate por defecto
      billingAmount, // nextBillingAmount = billingAmount por defecto
      startDate, // currentPeriodStart = startDate por defecto
      renewalDate, // currentPeriodEnd = renewalDate por defecto
      'active',
      null, // trialEndDate
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
    await this.subscriptionRepository.save(subscriptionEntity);

    // Crear y guardar los límites
    const limits = PartnerLimits.create(
      savedPartner.id,
      request.limitsMaxTenants,
      request.limitsMaxBranches,
      request.limitsMaxCustomers,
      request.limitsMaxRewards,
    );
    const limitsEntity = PartnerMapper.limitsToPersistence(limits);
    limitsEntity.partnerId = savedPartner.id;
    await this.limitsRepository.save(limitsEntity);

    // Crear y guardar las estadísticas iniciales
    const stats = PartnerStats.create(savedPartner.id);
    const statsEntity = PartnerMapper.statsToPersistence(stats);
    statsEntity.partnerId = savedPartner.id;
    await this.statsRepository.save(statsEntity);

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
}
