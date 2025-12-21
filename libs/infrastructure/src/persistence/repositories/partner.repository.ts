import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPartnerRepository, Partner } from '@libs/domain';
import { PartnerEntity } from '../entities/partner.entity';
import { PartnerSubscriptionEntity } from '../entities/partner-subscription.entity';
import { PartnerLimitsEntity } from '../entities/partner-limits.entity';
import { PartnerStatsEntity } from '../entities/partner-stats.entity';
import { PartnerMapper } from '../mappers/partner.mapper';

/**
 * Implementación del repositorio de partners usando TypeORM
 */
@Injectable()
export class PartnerRepository implements IPartnerRepository {
  constructor(
    @InjectRepository(PartnerEntity)
    private readonly partnerRepository: Repository<PartnerEntity>,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    @InjectRepository(PartnerLimitsEntity)
    private readonly limitsRepository: Repository<PartnerLimitsEntity>,
    @InjectRepository(PartnerStatsEntity)
    private readonly statsRepository: Repository<PartnerStatsEntity>,
  ) {}

  async save(partner: Partner): Promise<Partner> {
    const partnerEntity = PartnerMapper.toPersistence(partner);
    const savedEntity = await this.partnerRepository.save(partnerEntity);
    return PartnerMapper.toDomain(savedEntity);
  }

  async update(partner: Partner): Promise<Partner> {
    const partnerEntity = PartnerMapper.toPersistence(partner);
    const updatedEntity = await this.partnerRepository.save(partnerEntity);
    return PartnerMapper.toDomain(updatedEntity);
  }

  async findById(id: number): Promise<Partner | null> {
    const partnerEntity = await this.partnerRepository.findOne({
      where: { id },
      relations: ['subscription', 'limits', 'stats'],
    });

    if (!partnerEntity) {
      return null;
    }

    return PartnerMapper.toDomain(
      partnerEntity,
      partnerEntity.subscription,
      partnerEntity.limits,
      partnerEntity.stats,
    );
  }

  async findByEmail(email: string): Promise<Partner | null> {
    const partnerEntity = await this.partnerRepository.findOne({
      where: { email },
      relations: ['subscription', 'limits', 'stats'],
    });

    if (!partnerEntity) {
      return null;
    }

    return PartnerMapper.toDomain(
      partnerEntity,
      partnerEntity.subscription,
      partnerEntity.limits,
      partnerEntity.stats,
    );
  }

  async findByDomain(domain: string): Promise<Partner | null> {
    const partnerEntity = await this.partnerRepository.findOne({
      where: { domain },
      relations: ['subscription', 'limits', 'stats'],
    });

    if (!partnerEntity) {
      return null;
    }

    return PartnerMapper.toDomain(
      partnerEntity,
      partnerEntity.subscription,
      partnerEntity.limits,
      partnerEntity.stats,
    );
  }

  async findAll(): Promise<Partner[]> {
    const partnerEntities = await this.partnerRepository.find({
      relations: ['subscription', 'limits', 'stats'],
      order: {
        createdAt: 'DESC',
      },
    });

    return partnerEntities.map((entity) =>
      PartnerMapper.toDomain(
        entity,
        entity.subscription,
        entity.limits,
        entity.stats,
      ),
    );
  }
}
