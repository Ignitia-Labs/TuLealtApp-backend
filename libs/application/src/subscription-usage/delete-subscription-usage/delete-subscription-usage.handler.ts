import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerSubscriptionUsageEntity } from '@libs/infrastructure';
import { DeleteSubscriptionUsageRequest } from './delete-subscription-usage.request';
import { DeleteSubscriptionUsageResponse } from './delete-subscription-usage.response';

/**
 * Handler para el caso de uso de eliminar un registro de uso de suscripción
 */
@Injectable()
export class DeleteSubscriptionUsageHandler {
  constructor(
    @InjectRepository(PartnerSubscriptionUsageEntity)
    private readonly usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ) {}

  async execute(
    request: DeleteSubscriptionUsageRequest,
  ): Promise<DeleteSubscriptionUsageResponse> {
    const usageEntity = await this.usageRepository.findOne({
      where: { partnerSubscriptionId: request.partnerSubscriptionId },
    });

    if (!usageEntity) {
      throw new NotFoundException(
        `Usage record for subscription ID ${request.partnerSubscriptionId} not found`,
      );
    }

    await this.usageRepository.remove(usageEntity);

    return new DeleteSubscriptionUsageResponse(
      request.partnerSubscriptionId,
      'Subscription usage deleted successfully',
    );
  }
}

