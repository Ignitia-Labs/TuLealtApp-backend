import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPartnerRepository } from '@libs/domain';
import { GetPartnerRequest } from './get-partner.request';
import { GetPartnerResponse } from './get-partner.response';
import { PartnerEntity } from '@libs/infrastructure';
import { PartnerSubscriptionEntity } from '@libs/infrastructure';
import { PartnerLimitsEntity } from '@libs/infrastructure';
import { PartnerStatsEntity } from '@libs/infrastructure';
import { PartnerMapper } from '@libs/infrastructure';
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
    @InjectRepository(PartnerEntity)
    private readonly partnerEntityRepository: Repository<PartnerEntity>,
  ) {}

  async execute(request: GetPartnerRequest): Promise<GetPartnerResponse> {
    const partnerEntity = await this.partnerEntityRepository.findOne({
      where: { id: request.partnerId },
      relations: ['subscription', 'limits', 'stats'],
    });

    if (!partnerEntity) {
      throw new NotFoundException(`Partner with ID ${request.partnerId} not found`);
    }

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
          startDate: partnerEntity.subscription.startDate,
          renewalDate: partnerEntity.subscription.renewalDate,
          status: partnerEntity.subscription.status,
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

    // Formatear currencyId como 'currency-{id}'
    const formattedCurrencyId = `currency-${partnerEntity.currencyId}`;

    return new GetPartnerResponse(
      partner.id,
      partner.name,
      partner.responsibleName,
      partner.email,
      partner.phone,
      partner.country,
      partner.city,
      partner.plan,
      partner.logo,
      partner.category,
      partner.branchesNumber,
      partner.website,
      partner.socialMedia,
      partner.rewardType,
      formattedCurrencyId,
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
  }
}
