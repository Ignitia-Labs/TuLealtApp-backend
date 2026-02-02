import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPartnerRepository, IPricingPlanRepository } from '@libs/domain';
import { GetPartnersRequest } from './get-partners.request';
import { GetPartnersResponse } from './get-partners.response';
import { GetPartnerResponse } from '../get-partner/get-partner.response';
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
 * Handler para el caso de uso de obtener todos los partners
 */
@Injectable()
export class GetPartnersHandler {
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

  async execute(request: GetPartnersRequest): Promise<GetPartnersResponse> {
    const partnerEntities = await this.partnerEntityRepository.find({
      relations: ['subscription', 'subscription.usage'],
      order: {
        createdAt: 'DESC',
      },
    });

    // Filtrar por estado si no se incluyen inactivos
    const filteredEntities = request.includeInactive
      ? partnerEntities
      : partnerEntities.filter((entity) => entity.status === 'active');

    // Convertir a DTOs de respuesta
    const partnerResponses = await Promise.all(
      filteredEntities.map(async (partnerEntity) => {
        const partner = PartnerMapper.toDomain(
          partnerEntity,
          partnerEntity.subscription,
          null, // limits ya no se usa, se obtiene desde pricing_plan_limits
          null, // stats ya no se usa
        );

        // Mapear subscription con todos los campos
        const subscriptionDto: PartnerSubscriptionSwaggerDto | null = partnerEntity.subscription
          ? {
              planId: partnerEntity.subscription.planId,
              planType: partnerEntity.subscription.planType,
              startDate: partnerEntity.subscription.startDate,
              renewalDate: partnerEntity.subscription.renewalDate,
              status: partnerEntity.subscription.status,
              billingFrequency: partnerEntity.subscription.billingFrequency,
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
              nextBillingDate: partnerEntity.subscription.nextBillingDate,
              nextBillingAmount: Number(partnerEntity.subscription.nextBillingAmount) || 0,
              currentPeriodStart: partnerEntity.subscription.currentPeriodStart,
              currentPeriodEnd: partnerEntity.subscription.currentPeriodEnd,
              trialEndDate: partnerEntity.subscription.trialEndDate ?? null,
              pausedAt: partnerEntity.subscription.pausedAt ?? null,
              pauseReason: partnerEntity.subscription.pauseReason ?? null,
              gracePeriodDays: partnerEntity.subscription.gracePeriodDays ?? 7,
              retryAttempts: partnerEntity.subscription.retryAttempts ?? 0,
              maxRetryAttempts: partnerEntity.subscription.maxRetryAttempts ?? 3,
              discountPercent: partnerEntity.subscription.discountPercent
                ? Number(partnerEntity.subscription.discountPercent)
                : null,
              discountCode: partnerEntity.subscription.discountCode ?? null,
              lastPaymentDate: partnerEntity.subscription.lastPaymentDate ?? null,
              lastPaymentAmount: partnerEntity.subscription.lastPaymentAmount
                ? Number(partnerEntity.subscription.lastPaymentAmount)
                : null,
              paymentStatus: partnerEntity.subscription.paymentStatus ?? null,
              autoRenew: partnerEntity.subscription.autoRenew ?? true,
              createdAt: partnerEntity.subscription.createdAt,
              updatedAt: partnerEntity.subscription.updatedAt,
            }
          : null;

        // Mapear limits desde pricing_plan_limits
        let limitsDto: PartnerLimitsSwaggerDto | null = null;
        if (partnerEntity.subscription?.planId) {
          try {
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
            console.error(
              `Error al obtener límites desde pricing plan para partner ${partnerEntity.id}:`,
              limitsError,
            );
            limitsDto = null;
          }
        }

        // Mapear stats desde partner_subscription_usage
        let statsDto: PartnerStatsSwaggerDto | null = null;
        if (partnerEntity.subscription?.id) {
          // Intentar obtener desde la relación primero
          let usageEntity: PartnerSubscriptionUsageEntity | null = null;

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
        }

        return new GetPartnerResponse(
          partner.id,
          partner.name,
          partner.responsibleName,
          partner.email,
          partner.phone,
          partner.countryId,
          partner.city,
          partner.plan,
          partner.logo,
          partner.banner,
          partner.category,
          partner.branchesNumber,
          partner.website,
          partner.socialMedia,
          partner.currencyId || 0,
          partner.businessName,
          partner.taxId,
          partner.fiscalAddress,
          partner.paymentMethod,
          partner.billingEmail,
          partner.domain,
          partner.status,
          partner.createdAt,
          partner.updatedAt,
          subscriptionDto,
          limitsDto,
          statsDto,
        );
      }),
    );

    return new GetPartnersResponse(partnerResponses);
  }
}
