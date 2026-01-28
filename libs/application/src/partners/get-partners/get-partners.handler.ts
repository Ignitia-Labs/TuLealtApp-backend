import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPartnerRepository } from '@libs/domain';
import { GetPartnersRequest } from './get-partners.request';
import { GetPartnersResponse } from './get-partners.response';
import { GetPartnerResponse } from '../get-partner/get-partner.response';
import {
  PartnerEntity,
  PartnerMapper,
  PartnerSubscriptionUsageEntity,
} from '@libs/infrastructure';
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
    @InjectRepository(PartnerEntity)
    private readonly partnerEntityRepository: Repository<PartnerEntity>,
    @InjectRepository(PartnerSubscriptionUsageEntity)
    private readonly usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ) {}

  async execute(request: GetPartnersRequest): Promise<GetPartnersResponse> {
    const partnerEntities = await this.partnerEntityRepository.find({
      relations: ['subscription', 'subscription.usage', 'limits'],
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
          partnerEntity.limits,
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

      // Mapear limits
      const limitsDto: PartnerLimitsSwaggerDto | null = partnerEntity.limits
        ? {
            maxTenants: partnerEntity.limits.maxTenants,
            maxBranches: partnerEntity.limits.maxBranches,
            maxCustomers: partnerEntity.limits.maxCustomers,
            maxRewards: partnerEntity.limits.maxRewards,
            maxAdmins: partnerEntity.limits.maxAdmins ?? -1,
            storageGB: partnerEntity.limits.storageGB ?? -1,
            apiCallsPerMonth: partnerEntity.limits.apiCallsPerMonth ?? -1,
          }
        : null;

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
        partner.rewardType,
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
