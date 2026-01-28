import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPartnerRepository } from '@libs/domain';
import { GetPartnersRequest } from './get-partners.request';
import { GetPartnersResponse } from './get-partners.response';
import { GetPartnerResponse } from '../get-partner/get-partner.response';
import { PartnerEntity } from '@libs/infrastructure';
import { PartnerMapper } from '@libs/infrastructure';
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
  ) {}

  async execute(request: GetPartnersRequest): Promise<GetPartnersResponse> {
    const partnerEntities = await this.partnerEntityRepository.find({
      relations: ['subscription', 'limits', 'stats'],
      order: {
        createdAt: 'DESC',
      },
    });

    // Filtrar por estado si no se incluyen inactivos
    const filteredEntities = request.includeInactive
      ? partnerEntities
      : partnerEntities.filter((entity) => entity.status === 'active');

    // Convertir a DTOs de respuesta
    const partnerResponses = filteredEntities.map((partnerEntity) => {
      const partner = PartnerMapper.toDomain(
        partnerEntity,
        partnerEntity.subscription,
        partnerEntity.limits,
        partnerEntity.stats,
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

      // Mapear stats
      const statsDto: PartnerStatsSwaggerDto | null = partnerEntity.stats
        ? {
            tenantsCount: partnerEntity.stats.tenantsCount,
            branchesCount: partnerEntity.stats.branchesCount,
            customersCount: partnerEntity.stats.customersCount,
            rewardsCount: partnerEntity.stats.rewardsCount,
          }
        : null;

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
    });

    return new GetPartnersResponse(partnerResponses);
  }
}
