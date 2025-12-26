import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICustomerTierRepository, CustomerTier } from '@libs/domain';
import { CustomerTierEntity } from '../entities/customer-tier.entity';
import { CustomerTierMapper } from '../mappers/customer-tier.mapper';

/**
 * Implementación del repositorio de CustomerTier usando TypeORM
 */
@Injectable()
export class CustomerTierRepository implements ICustomerTierRepository {
  constructor(
    @InjectRepository(CustomerTierEntity)
    private readonly customerTierRepository: Repository<CustomerTierEntity>,
  ) {}

  async findById(id: number): Promise<CustomerTier | null> {
    const entity = await this.customerTierRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return CustomerTierMapper.toDomain(entity);
  }

  async findByTenantId(tenantId: number): Promise<CustomerTier[]> {
    const entities = await this.customerTierRepository.find({
      where: { tenantId },
      order: { priority: 'ASC' },
    });

    return entities.map((entity) => CustomerTierMapper.toDomain(entity));
  }

  async findActiveByTenantId(tenantId: number): Promise<CustomerTier[]> {
    const entities = await this.customerTierRepository.find({
      where: { tenantId, status: 'active' },
      order: { priority: 'ASC' },
    });

    return entities.map((entity) => CustomerTierMapper.toDomain(entity));
  }

  async findByPoints(tenantId: number, points: number): Promise<CustomerTier | null> {
    const entities = await this.customerTierRepository.find({
      where: { tenantId, status: 'active' },
      order: { priority: 'ASC' },
    });

    const tiers = entities.map((entity) => CustomerTierMapper.toDomain(entity));
    return tiers.find((tier) => tier.belongsToTier(points)) || null;
  }

  async save(tier: CustomerTier): Promise<CustomerTier> {
    const entity = CustomerTierMapper.toPersistence(tier);
    const savedEntity = await this.customerTierRepository.save(entity);
    return CustomerTierMapper.toDomain(savedEntity);
  }

  async update(tier: CustomerTier): Promise<CustomerTier> {
    const entity = CustomerTierMapper.toPersistence(tier);
    const updatedEntity = await this.customerTierRepository.save(entity);
    return CustomerTierMapper.toDomain(updatedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.customerTierRepository.delete(id);
  }
}
