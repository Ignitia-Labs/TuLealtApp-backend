import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ITenantRepository, Tenant } from '@libs/domain';
import { TenantEntity } from '../entities/tenant.entity';
import { TenantFeaturesEntity } from '../entities/tenant-features.entity';
import { TenantMapper } from '../mappers/tenant.mapper';

/**
 * Implementación del repositorio de tenants usando TypeORM
 */
@Injectable()
export class TenantRepository implements ITenantRepository {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(TenantFeaturesEntity)
    private readonly featuresRepository: Repository<TenantFeaturesEntity>,
  ) {}

  async save(tenant: Tenant): Promise<Tenant> {
    const tenantEntity = TenantMapper.toPersistence(tenant);
    const savedEntity = await this.tenantRepository.save(tenantEntity);
    return TenantMapper.toDomain(savedEntity);
  }

  async update(tenant: Tenant): Promise<Tenant> {
    const tenantEntity = TenantMapper.toPersistence(tenant);
    const updatedEntity = await this.tenantRepository.save(tenantEntity);
    return TenantMapper.toDomain(updatedEntity);
  }

  async findById(id: number): Promise<Tenant | null> {
    const tenantEntity = await this.tenantRepository.findOne({
      where: { id },
      relations: ['features'],
    });

    if (!tenantEntity) {
      return null;
    }

    return TenantMapper.toDomain(tenantEntity, tenantEntity.features);
  }

  async findByPartnerId(partnerId: number): Promise<Tenant[]> {
    const tenantEntities = await this.tenantRepository.find({
      where: { partnerId },
      relations: ['features'],
      order: {
        createdAt: 'DESC',
      },
    });

    return tenantEntities.map((entity) => TenantMapper.toDomain(entity, entity.features));
  }

  async findAll(): Promise<Tenant[]> {
    const tenantEntities = await this.tenantRepository.find({
      relations: ['features'],
      order: {
        createdAt: 'DESC',
      },
    });

    return tenantEntities.map((entity) => TenantMapper.toDomain(entity, entity.features));
  }

  async findAllActive(): Promise<Tenant[]> {
    const tenantEntities = await this.tenantRepository.find({
      where: { status: 'active' },
      relations: ['features'],
      order: {
        createdAt: 'DESC',
      },
    });

    return tenantEntities.map((entity) => TenantMapper.toDomain(entity, entity.features));
  }

  async delete(id: number): Promise<void> {
    await this.tenantRepository.delete(id);
  }

  async findByQuickSearchCode(code: string): Promise<Tenant | null> {
    const tenantEntity = await this.tenantRepository.findOne({
      where: { quickSearchCode: code },
      relations: ['features'],
    });

    if (!tenantEntity) {
      return null;
    }

    return TenantMapper.toDomain(tenantEntity, tenantEntity.features);
  }
}
