import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPartnerRepository, Partner } from '@libs/domain';
import { PartnerEntity } from '@libs/infrastructure/entities/partner/partner.entity';
import { PartnerSubscriptionEntity } from '@libs/infrastructure/entities/partner/partner-subscription.entity';
import { PartnerMapper } from '@libs/infrastructure/mappers/partner/partner.mapper';

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
  ) {}

  async save(partner: Partner): Promise<Partner> {
    const partnerEntity = PartnerMapper.toPersistence(partner);
    const savedEntity = await this.partnerRepository.save(partnerEntity);
    // Recargar con relaciones
    const reloadedEntity = await this.partnerRepository.findOne({
      where: { id: savedEntity.id },
      relations: ['subscription'],
    });
    if (!reloadedEntity) {
      throw new Error(`Failed to reload partner with ID ${savedEntity.id}`);
    }
    return PartnerMapper.toDomain(
      reloadedEntity,
      reloadedEntity.subscription,
      null, // limits ya no se usa, se obtiene desde pricing_plan_limits
      null,
    );
  }

  async update(partner: Partner): Promise<Partner> {
    const partnerEntity = PartnerMapper.toPersistence(partner);
    const updatedEntity = await this.partnerRepository.save(partnerEntity);
    // Recargar con relaciones
    const reloadedEntity = await this.partnerRepository.findOne({
      where: { id: updatedEntity.id },
      relations: ['subscription'],
    });
    if (!reloadedEntity) {
      throw new Error(`Failed to reload partner with ID ${updatedEntity.id}`);
    }
    return PartnerMapper.toDomain(
      reloadedEntity,
      reloadedEntity.subscription,
      null, // limits ya no se usa, se obtiene desde pricing_plan_limits
      null,
    );
  }

  async findById(id: number): Promise<Partner | null> {
    const partnerEntity = await this.partnerRepository.findOne({
      where: { id },
      relations: ['subscription'],
    });

    if (!partnerEntity) {
      return null;
    }

    return PartnerMapper.toDomain(
      partnerEntity,
      partnerEntity.subscription,
      null, // limits ya no se usa, se obtiene desde pricing_plan_limits
      null, // stats ya no se usa
    );
  }

  async findByEmail(email: string): Promise<Partner | null> {
    const partnerEntity = await this.partnerRepository.findOne({
      where: { email },
      relations: ['subscription'],
    });

    if (!partnerEntity) {
      return null;
    }

    return PartnerMapper.toDomain(
      partnerEntity,
      partnerEntity.subscription,
      null, // limits ya no se usa, se obtiene desde pricing_plan_limits
      null, // stats ya no se usa
    );
  }

  async findByDomain(domain: string): Promise<Partner | null> {
    const partnerEntity = await this.partnerRepository.findOne({
      where: { domain },
      relations: ['subscription'],
    });

    if (!partnerEntity) {
      return null;
    }

    return PartnerMapper.toDomain(
      partnerEntity,
      partnerEntity.subscription,
      null, // limits ya no se usa, se obtiene desde pricing_plan_limits
      null, // stats ya no se usa
    );
  }

  async findAll(): Promise<Partner[]> {
    const partnerEntities = await this.partnerRepository.find({
      relations: ['subscription'],
      order: {
        createdAt: 'DESC',
      },
    });

    return partnerEntities.map(
      (entity) => PartnerMapper.toDomain(entity, entity.subscription, null, null), // limits y stats ya no se usan
    );
  }

  async delete(id: number): Promise<void> {
    await this.partnerRepository.delete(id);
  }
}
