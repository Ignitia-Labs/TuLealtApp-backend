import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerSubscriptionUsage } from '@libs/domain';
import {
  PartnerSubscriptionUsageEntity,
  PartnerSubscriptionUsageMapper,
} from '@libs/infrastructure';
import { GetSubscriptionUsageRequest } from './get-subscription-usage.request';
import { GetSubscriptionUsageResponse } from './get-subscription-usage.response';

/**
 * Handler para el caso de uso de obtener un registro de uso de suscripción
 */
@Injectable()
export class GetSubscriptionUsageHandler {
  constructor(
    @InjectRepository(PartnerSubscriptionUsageEntity)
    private readonly usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ) {}

  async execute(request: GetSubscriptionUsageRequest): Promise<GetSubscriptionUsageResponse> {
    const usageEntity = await this.usageRepository.findOne({
      where: { partnerSubscriptionId: request.partnerSubscriptionId },
    });

    if (!usageEntity) {
      throw new NotFoundException(
        `Usage record for subscription ID ${request.partnerSubscriptionId} not found`,
      );
    }

    const usage = PartnerSubscriptionUsageMapper.toDomain(usageEntity);

    return new GetSubscriptionUsageResponse(
      usage.id,
      usage.partnerSubscriptionId,
      usage.tenantsCount,
      usage.branchesCount,
      usage.customersCount,
      usage.rewardsCount,
      usage.createdAt,
      usage.updatedAt,
    );
  }
}
