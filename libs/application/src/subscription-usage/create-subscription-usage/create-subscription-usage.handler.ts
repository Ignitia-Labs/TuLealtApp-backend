import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerSubscriptionUsage } from '@libs/domain';
import {
  PartnerSubscriptionUsageEntity,
  PartnerSubscriptionEntity,
  PartnerSubscriptionUsageMapper,
} from '@libs/infrastructure';
import { CreateSubscriptionUsageRequest } from './create-subscription-usage.request';
import { CreateSubscriptionUsageResponse } from './create-subscription-usage.response';

/**
 * Handler para el caso de uso de crear un registro de uso de suscripción
 */
@Injectable()
export class CreateSubscriptionUsageHandler {
  constructor(
    @InjectRepository(PartnerSubscriptionUsageEntity)
    private readonly usageRepository: Repository<PartnerSubscriptionUsageEntity>,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
  ) {}

  async execute(
    request: CreateSubscriptionUsageRequest,
  ): Promise<CreateSubscriptionUsageResponse> {
    // Validar que la suscripción existe
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: request.partnerSubscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with ID ${request.partnerSubscriptionId} not found`,
      );
    }

    // Verificar si ya existe un registro de uso para esta suscripción
    const existingUsage = await this.usageRepository.findOne({
      where: { partnerSubscriptionId: request.partnerSubscriptionId },
    });

    if (existingUsage) {
      throw new BadRequestException(
        'Usage record already exists for this subscription. Use update instead.',
      );
    }

    // Crear el registro de uso
    const usage = PartnerSubscriptionUsage.create(
      request.partnerSubscriptionId,
      request.tenantsCount ?? 0,
      request.branchesCount ?? 0,
      request.customersCount ?? 0,
      request.rewardsCount ?? 0,
    );

    // Guardar
    const usageEntity = PartnerSubscriptionUsageMapper.toPersistence(usage);
    const savedEntity = await this.usageRepository.save(usageEntity);

    return new CreateSubscriptionUsageResponse(
      savedEntity.id,
      savedEntity.partnerSubscriptionId,
      savedEntity.tenantsCount,
      savedEntity.branchesCount,
      savedEntity.customersCount,
      savedEntity.rewardsCount,
      savedEntity.createdAt,
    );
  }
}

