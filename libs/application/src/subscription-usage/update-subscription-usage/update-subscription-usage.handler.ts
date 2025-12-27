import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerSubscriptionUsage } from '@libs/domain';
import {
  PartnerSubscriptionUsageEntity,
  PartnerSubscriptionUsageMapper,
} from '@libs/infrastructure';
import { UpdateSubscriptionUsageRequest } from './update-subscription-usage.request';
import { UpdateSubscriptionUsageResponse } from './update-subscription-usage.response';

/**
 * Handler para el caso de uso de actualizar un registro de uso de suscripción
 */
@Injectable()
export class UpdateSubscriptionUsageHandler {
  constructor(
    @InjectRepository(PartnerSubscriptionUsageEntity)
    private readonly usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ) {}

  async execute(
    request: UpdateSubscriptionUsageRequest,
  ): Promise<UpdateSubscriptionUsageResponse> {
    const usageEntity = await this.usageRepository.findOne({
      where: { partnerSubscriptionId: request.partnerSubscriptionId },
    });

    if (!usageEntity) {
      throw new NotFoundException(
        `Usage record for subscription ID ${request.partnerSubscriptionId} not found`,
      );
    }

    const usage = PartnerSubscriptionUsageMapper.toDomain(usageEntity);

    // Crear nuevo objeto con valores actualizados
    const updatedUsage = PartnerSubscriptionUsage.create(
      usage.partnerSubscriptionId,
      request.tenantsCount ?? usage.tenantsCount,
      request.branchesCount ?? usage.branchesCount,
      request.customersCount ?? usage.customersCount,
      request.rewardsCount ?? usage.rewardsCount,
      usage.id,
    );

    // Guardar cambios
    const updatedEntity = PartnerSubscriptionUsageMapper.toPersistence(updatedUsage);
    const savedEntity = await this.usageRepository.save(updatedEntity);

    return new UpdateSubscriptionUsageResponse(savedEntity.id, savedEntity.updatedAt);
  }
}

