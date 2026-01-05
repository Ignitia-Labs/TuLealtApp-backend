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

      // Mapear subscription
      const subscriptionDto: PartnerSubscriptionSwaggerDto | null = partnerEntity.subscription
        ? {
            planId: partnerEntity.subscription.planId,
            planType: partnerEntity.subscription.planType,
            startDate: partnerEntity.subscription.startDate,
            renewalDate: partnerEntity.subscription.renewalDate,
            status: partnerEntity.subscription.status,
            billingFrequency: partnerEntity.subscription.billingFrequency,
            billingAmount: partnerEntity.subscription.billingAmount,
            currency: partnerEntity.subscription.currency,
            nextBillingDate: partnerEntity.subscription.nextBillingDate,
            nextBillingAmount: partnerEntity.subscription.nextBillingAmount,
            currentPeriodStart: partnerEntity.subscription.currentPeriodStart,
            currentPeriodEnd: partnerEntity.subscription.currentPeriodEnd,
            trialEndDate: partnerEntity.subscription.trialEndDate,
            lastPaymentDate: partnerEntity.subscription.lastPaymentDate,
            lastPaymentAmount: partnerEntity.subscription.lastPaymentAmount,
            paymentStatus: partnerEntity.subscription.paymentStatus,
            autoRenew: partnerEntity.subscription.autoRenew,
          }
        : null;

      // Mapear limits
      const limitsDto: PartnerLimitsSwaggerDto | null = partnerEntity.limits
        ? {
            maxTenants: partnerEntity.limits.maxTenants,
            maxBranches: partnerEntity.limits.maxBranches,
            maxCustomers: partnerEntity.limits.maxCustomers,
            maxRewards: partnerEntity.limits.maxRewards,
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
