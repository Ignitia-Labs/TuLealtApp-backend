import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPartnerSubscriptionRepository, PartnerSubscription } from '@libs/domain';
import { PartnerSubscriptionEntity } from '@libs/infrastructure/entities/partner/partner-subscription.entity';
import { PartnerSubscriptionMapper } from '@libs/infrastructure/mappers/partner/partner-subscription.mapper';

/**
 * Implementación del repositorio de PartnerSubscription usando TypeORM
 */
@Injectable()
export class PartnerSubscriptionRepository implements IPartnerSubscriptionRepository {
  constructor(
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
  ) {}

  async findByPartnerId(partnerId: number): Promise<PartnerSubscription | null> {
    const subscriptionEntity = await this.subscriptionRepository.findOne({
      where: { partnerId: partnerId },
    });

    if (!subscriptionEntity) {
      return null;
    }

    return PartnerSubscriptionMapper.toDomain(subscriptionEntity);
  }

  async findById(id: number): Promise<PartnerSubscription | null> {
    const subscriptionEntity = await this.subscriptionRepository.findOne({
      where: { id },
    });

    if (!subscriptionEntity) {
      return null;
    }

    return PartnerSubscriptionMapper.toDomain(subscriptionEntity);
  }

  async update(subscription: PartnerSubscription): Promise<PartnerSubscription> {
    const subscriptionEntity = PartnerSubscriptionMapper.toPersistence(subscription);
    const updatedEntity = await this.subscriptionRepository.save(subscriptionEntity);
    return PartnerSubscriptionMapper.toDomain(updatedEntity);
  }
}
