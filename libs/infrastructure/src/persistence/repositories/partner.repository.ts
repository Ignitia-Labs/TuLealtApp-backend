import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { IPartnerRepository, Partner, PartnerStats } from '@libs/domain';
import { PartnerEntity } from '../entities/partner.entity';
import { PartnerSubscriptionEntity } from '../entities/partner-subscription.entity';
import { PartnerLimitsEntity } from '../entities/partner-limits.entity';
import { PartnerStatsEntity } from '../entities/partner-stats.entity';
import { TenantEntity } from '../entities/tenant.entity';
import { BranchEntity } from '../entities/branch.entity';
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
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(BranchEntity)
    private readonly branchRepository: Repository<BranchEntity>,
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
      PartnerMapper.toDomain(entity, entity.subscription, entity.limits, entity.stats),
    );
  }

  /**
   * Actualiza las estadísticas del partner basándose en los datos reales de la base de datos
   */
  async updateStats(partnerId: number): Promise<void> {
    // Contar tenants del partner
    const tenantsCount = await this.tenantRepository.count({
      where: { partnerId },
    });

    // Contar branches de todos los tenants del partner
    const tenants = await this.tenantRepository.find({
      where: { partnerId },
      select: ['id'],
    });
    const tenantIds = tenants.map((t) => t.id);
    const branchesCount =
      tenantIds.length > 0
        ? await this.branchRepository.count({
            where: { tenantId: In(tenantIds) },
          })
        : 0;

    // Obtener o crear las stats del partner
    let statsEntity = await this.statsRepository.findOne({
      where: { partnerId },
    });

    if (!statsEntity) {
      // Crear stats si no existen
      statsEntity = new PartnerStatsEntity();
      statsEntity.partnerId = partnerId;
      statsEntity.tenantsCount = 0;
      statsEntity.branchesCount = 0;
      statsEntity.customersCount = 0;
      statsEntity.rewardsCount = 0;
    }

    // Actualizar los conteos
    statsEntity.tenantsCount = tenantsCount;
    statsEntity.branchesCount = branchesCount;
    // customersCount y rewardsCount se mantienen (se actualizarán por otros procesos)

    await this.statsRepository.save(statsEntity);
  }

  async delete(id: number): Promise<void> {
    await this.partnerRepository.delete(id);
  }
}
