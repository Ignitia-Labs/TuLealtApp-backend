import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPartnerRepository, IPricingPlanRepository } from '@libs/domain';
import { GetPartnerRequest } from './get-partner.request';
import { GetPartnerResponse } from './get-partner.response';
import {
  PartnerEntity,
  PartnerMapper,
  PartnerSubscriptionUsageEntity,
  PartnerSubscriptionEntity,
} from '@libs/infrastructure';
import { SubscriptionUsageHelper } from '@libs/application';
import { PartnerSubscriptionSwaggerDto } from '../dto/partner-subscription-swagger.dto';
import { PartnerLimitsSwaggerDto } from '../dto/partner-limits-swagger.dto';
import { PartnerStatsSwaggerDto } from '../dto/partner-stats-swagger.dto';

/**
 * Handler para el caso de uso de obtener un partner por ID
 */
@Injectable()
export class GetPartnerHandler {
  constructor(
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('IPricingPlanRepository')
    private readonly pricingPlanRepository: IPricingPlanRepository,
    @InjectRepository(PartnerEntity)
    private readonly partnerEntityRepository: Repository<PartnerEntity>,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    @InjectRepository(PartnerSubscriptionUsageEntity)
    private readonly usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ) {}

  async execute(request: GetPartnerRequest): Promise<GetPartnerResponse> {
    try {
      console.log(`[GetPartnerHandler] Buscando partner con ID: ${request.partnerId}`);

      // Intentar obtener con relaciones primero
      let partnerEntity: PartnerEntity | null = null;
      try {
        partnerEntity = await this.partnerEntityRepository.findOne({
          where: { id: request.partnerId },
          relations: ['subscription', 'subscription.usage'],
        });
      } catch (relationError) {
        console.warn(
          `[GetPartnerHandler] Error al cargar relaciones, intentando sin relaciones:`,
          relationError,
        );
        // Si falla con relaciones, intentar sin ellas
        partnerEntity = await this.partnerEntityRepository.findOne({
          where: { id: request.partnerId },
        });
      }

      if (!partnerEntity) {
        throw new NotFoundException(`Partner with ID ${request.partnerId} not found`);
      }

      console.log(`[GetPartnerHandler] Partner encontrado: ${partnerEntity.name}`);
      console.log(
        `[GetPartnerHandler] Subscription: ${partnerEntity.subscription ? 'existe' : 'null'}`,
      );

      let partner;
      try {
        partner = PartnerMapper.toDomain(
          partnerEntity,
          partnerEntity.subscription || null,
          null, // limits ya no se usa, se obtiene desde pricing_plan_limits
          null, // stats ya no se usa
        );
        console.log(`[GetPartnerHandler] Partner mapeado exitosamente`);
      } catch (mapperError) {
        console.error('[GetPartnerHandler] Error en PartnerMapper.toDomain:', mapperError);
        throw mapperError;
      }

      // Mapear subscription con validación de propiedades
      let subscriptionDto: PartnerSubscriptionSwaggerDto | null = null;
      if (partnerEntity.subscription) {
        try {
          // Validar que las fechas requeridas existan
          const startDate = partnerEntity.subscription.startDate
            ? new Date(partnerEntity.subscription.startDate)
            : new Date();
          const renewalDate = partnerEntity.subscription.renewalDate
            ? new Date(partnerEntity.subscription.renewalDate)
            : new Date();
          const nextBillingDate = partnerEntity.subscription.nextBillingDate
            ? new Date(partnerEntity.subscription.nextBillingDate)
            : new Date();
          const currentPeriodStart = partnerEntity.subscription.currentPeriodStart
            ? new Date(partnerEntity.subscription.currentPeriodStart)
            : new Date();
          const currentPeriodEnd = partnerEntity.subscription.currentPeriodEnd
            ? new Date(partnerEntity.subscription.currentPeriodEnd)
            : new Date();

          subscriptionDto = {
            planId: partnerEntity.subscription.planId || 0,
            planType: (partnerEntity.subscription.planType || 'conecta') as
              | 'esencia'
              | 'conecta'
              | 'inspira',
            startDate: startDate,
            renewalDate: renewalDate,
            status: (partnerEntity.subscription.status || 'active') as
              | 'active'
              | 'expired'
              | 'suspended'
              | 'cancelled'
              | 'trialing'
              | 'past_due'
              | 'paused',
            billingFrequency: (partnerEntity.subscription.billingFrequency || 'monthly') as
              | 'monthly'
              | 'quarterly'
              | 'semiannual'
              | 'annual',
            billingAmount: Number(partnerEntity.subscription.billingAmount) || 0,
            includeTax: partnerEntity.subscription.includeTax ?? false,
            taxPercent: partnerEntity.subscription.taxPercent
              ? Number(partnerEntity.subscription.taxPercent)
              : null,
            basePrice: Number(partnerEntity.subscription.basePrice) || 0,
            taxAmount: Number(partnerEntity.subscription.taxAmount) || 0,
            totalPrice: Number(partnerEntity.subscription.totalPrice) || 0,
            currency: partnerEntity.subscription.currency || 'USD',
            currencyId: partnerEntity.subscription.currencyId ?? null,
            nextBillingDate: nextBillingDate,
            nextBillingAmount: Number(partnerEntity.subscription.nextBillingAmount) || 0,
            currentPeriodStart: currentPeriodStart,
            currentPeriodEnd: currentPeriodEnd,
            trialEndDate: partnerEntity.subscription.trialEndDate
              ? new Date(partnerEntity.subscription.trialEndDate)
              : null,
            pausedAt: partnerEntity.subscription.pausedAt
              ? new Date(partnerEntity.subscription.pausedAt)
              : null,
            pauseReason: partnerEntity.subscription.pauseReason ?? null,
            gracePeriodDays: partnerEntity.subscription.gracePeriodDays ?? 7,
            retryAttempts: partnerEntity.subscription.retryAttempts ?? 0,
            maxRetryAttempts: partnerEntity.subscription.maxRetryAttempts ?? 3,
            discountPercent: partnerEntity.subscription.discountPercent
              ? Number(partnerEntity.subscription.discountPercent)
              : null,
            discountCode: partnerEntity.subscription.discountCode ?? null,
            lastPaymentDate: partnerEntity.subscription.lastPaymentDate
              ? new Date(partnerEntity.subscription.lastPaymentDate)
              : null,
            lastPaymentAmount: partnerEntity.subscription.lastPaymentAmount
              ? Number(partnerEntity.subscription.lastPaymentAmount)
              : null,
            paymentStatus: partnerEntity.subscription.paymentStatus as
              | 'paid'
              | 'pending'
              | 'failed'
              | null,
            autoRenew:
              partnerEntity.subscription.autoRenew !== undefined
                ? partnerEntity.subscription.autoRenew
                : true,
            createdAt: partnerEntity.subscription.createdAt,
            updatedAt: partnerEntity.subscription.updatedAt,
          };
          console.log('[GetPartnerHandler] Subscription DTO creado exitosamente');
        } catch (subscriptionError) {
          console.error('[GetPartnerHandler] Error al mapear subscription:', subscriptionError);
          if (subscriptionError instanceof Error) {
            console.error('[GetPartnerHandler] Subscription error stack:', subscriptionError.stack);
          }
          subscriptionDto = null;
        }
      }

      // Mapear limits desde pricing_plan_limits
      let limitsDto: PartnerLimitsSwaggerDto | null = null;
      if (partnerEntity.subscription?.planId) {
        try {
          // Obtener límites desde pricing_plan_limits
          const planLimits = await SubscriptionUsageHelper.getPlanLimitsForPartner(
            partnerEntity.id,
            this.subscriptionRepository,
            this.pricingPlanRepository,
          );

          if (planLimits) {
            limitsDto = {
              maxTenants: planLimits.maxTenants ?? -1,
              maxBranches: planLimits.maxBranches ?? -1,
              maxCustomers: planLimits.maxCustomers ?? -1,
              maxRewards: planLimits.maxRewards ?? -1,
              maxAdmins: planLimits.maxAdmins ?? -1,
              storageGB: planLimits.storageGB ?? -1,
              apiCallsPerMonth: planLimits.apiCallsPerMonth ?? -1,
              maxLoyaltyPrograms: planLimits.maxLoyaltyPrograms ?? -1,
              maxLoyaltyProgramsBase: planLimits.maxLoyaltyProgramsBase ?? -1,
              maxLoyaltyProgramsPromo: planLimits.maxLoyaltyProgramsPromo ?? -1,
              maxLoyaltyProgramsPartner: planLimits.maxLoyaltyProgramsPartner ?? -1,
              maxLoyaltyProgramsSubscription: planLimits.maxLoyaltyProgramsSubscription ?? -1,
              maxLoyaltyProgramsExperimental: planLimits.maxLoyaltyProgramsExperimental ?? -1,
            };
          }
        } catch (limitsError) {
          console.error('Error al obtener límites desde pricing plan:', limitsError);
          limitsDto = null;
        }
      }

      // Mapear stats desde partner_subscription_usage
      let statsDto: PartnerStatsSwaggerDto | null = null;
      if (partnerEntity.subscription?.id) {
        try {
          // Obtener usage desde la relación o desde el repositorio
          let usageEntity: PartnerSubscriptionUsageEntity | null = null;

          // Intentar obtener desde la relación primero
          if (partnerEntity.subscription.usage) {
            usageEntity = partnerEntity.subscription.usage;
          } else {
            // Si no está cargado, buscar desde el repositorio
            usageEntity = await this.usageRepository.findOne({
              where: { partnerSubscriptionId: partnerEntity.subscription.id },
            });
          }

          if (usageEntity) {
            statsDto = {
              tenantsCount: Number(usageEntity.tenantsCount) || 0,
              branchesCount: Number(usageEntity.branchesCount) || 0,
              customersCount: Number(usageEntity.customersCount) || 0,
              rewardsCount: Number(usageEntity.rewardsCount) || 0,
              loyaltyProgramsCount: Number(usageEntity.loyaltyProgramsCount) || 0,
              loyaltyProgramsBaseCount: Number(usageEntity.loyaltyProgramsBaseCount) || 0,
              loyaltyProgramsPromoCount: Number(usageEntity.loyaltyProgramsPromoCount) || 0,
              loyaltyProgramsPartnerCount: Number(usageEntity.loyaltyProgramsPartnerCount) || 0,
              loyaltyProgramsSubscriptionCount:
                Number(usageEntity.loyaltyProgramsSubscriptionCount) || 0,
              loyaltyProgramsExperimentalCount:
                Number(usageEntity.loyaltyProgramsExperimentalCount) || 0,
            };
          }
        } catch (statsError) {
          console.error('Error al mapear stats desde subscription usage:', statsError);
          statsDto = null;
        }
      }

      console.log(`[GetPartnerHandler] Creando GetPartnerResponse para partner ID: ${partner.id}`);
      console.log(`[GetPartnerHandler] Partner createdAt:`, partner.createdAt);
      console.log(`[GetPartnerHandler] Partner updatedAt:`, partner.updatedAt);

      try {
        const response = new GetPartnerResponse(
          partner.id,
          partner.name || '',
          partner.responsibleName || '',
          partner.email || '',
          partner.phone || '',
          partner.countryId || null,
          partner.city || '',
          partner.plan || '',
          partner.logo || null,
          partner.banner || null,
          partner.category || '',
          partner.branchesNumber || 0,
          partner.website || null,
          partner.socialMedia || null,
          partner.currencyId || 0,
          partner.businessName || '',
          partner.taxId || '',
          partner.fiscalAddress || '',
          partner.paymentMethod || '',
          partner.billingEmail || '',
          partner.domain || '',
          partner.status || 'active',
          partner.createdAt || new Date(),
          partner.updatedAt || new Date(),
          subscriptionDto,
          limitsDto,
          statsDto,
        );
        console.log(`[GetPartnerHandler] GetPartnerResponse creado exitosamente`);
        return response;
      } catch (responseError) {
        console.error('[GetPartnerHandler] Error al crear GetPartnerResponse:', responseError);
        throw responseError;
      }
    } catch (error) {
      // Si es una excepción conocida, relanzarla
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Para otros errores, loggear y relanzar con un mensaje más descriptivo
      console.error('Error en GetPartnerHandler:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('Stack trace:', errorStack);
      throw new InternalServerErrorException(
        `Error al obtener partner con ID ${request.partnerId}: ${errorMessage}`,
      );
    }
  }
}
