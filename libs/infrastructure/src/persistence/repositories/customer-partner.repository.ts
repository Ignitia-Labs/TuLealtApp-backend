import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICustomerPartnerRepository, CustomerPartner } from '@libs/domain';
import { CustomerPartnerEntity } from '../entities/customer-partner.entity';
import { CustomerPartnerMapper } from '../mappers/customer-partner.mapper';

/**
 * Implementación del repositorio de customer partners usando TypeORM
 */
@Injectable()
export class CustomerPartnerRepository implements ICustomerPartnerRepository {
  constructor(
    @InjectRepository(CustomerPartnerEntity)
    private readonly customerPartnerRepository: Repository<CustomerPartnerEntity>,
  ) {}

  async findById(id: number): Promise<CustomerPartner | null> {
    const entity = await this.customerPartnerRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return CustomerPartnerMapper.toDomain(entity);
  }

  async save(customerPartner: CustomerPartner): Promise<CustomerPartner> {
    const entity = CustomerPartnerMapper.toPersistence(customerPartner);
    const savedEntity = await this.customerPartnerRepository.save(entity);
    return CustomerPartnerMapper.toDomain(savedEntity);
  }

  async update(customerPartner: CustomerPartner): Promise<CustomerPartner> {
    const entity = CustomerPartnerMapper.toPersistence(customerPartner);
    const updatedEntity = await this.customerPartnerRepository.save(entity);
    return CustomerPartnerMapper.toDomain(updatedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.customerPartnerRepository.delete(id);
  }

  async findByUserId(userId: number): Promise<CustomerPartner[]> {
    const entities = await this.customerPartnerRepository.find({
      where: { userId },
      order: {
        joinedDate: 'DESC',
      },
    });

    return entities.map((entity) => CustomerPartnerMapper.toDomain(entity));
  }

  async findByUserIdAndStatus(userId: number, status: string): Promise<CustomerPartner[]> {
    const entities = await this.customerPartnerRepository.find({
      where: {
        userId,
        status: status as 'active' | 'inactive' | 'suspended',
      },
      order: {
        joinedDate: 'DESC',
      },
    });

    return entities.map((entity) => CustomerPartnerMapper.toDomain(entity));
  }

  async findByUserIdAndPartnerId(userId: number, partnerId: number): Promise<CustomerPartner[]> {
    const entities = await this.customerPartnerRepository.find({
      where: {
        userId,
        partnerId,
      },
      order: {
        joinedDate: 'DESC',
      },
    });

    return entities.map((entity) => CustomerPartnerMapper.toDomain(entity));
  }

  async findByUserIdAndPartnerIdAndTenantId(
    userId: number,
    partnerId: number,
    tenantId: number,
  ): Promise<CustomerPartner | null> {
    const entity = await this.customerPartnerRepository.findOne({
      where: {
        userId,
        partnerId,
        tenantId,
      },
    });

    if (!entity) {
      return null;
    }

    return CustomerPartnerMapper.toDomain(entity);
  }

  async findByPartnerId(partnerId: number): Promise<CustomerPartner[]> {
    const entities = await this.customerPartnerRepository.find({
      where: { partnerId },
      order: {
        joinedDate: 'DESC',
      },
    });

    return entities.map((entity) => CustomerPartnerMapper.toDomain(entity));
  }

  async findByPartnerIdAndStatus(partnerId: number, status: string): Promise<CustomerPartner[]> {
    const entities = await this.customerPartnerRepository.find({
      where: {
        partnerId,
        status: status as 'active' | 'inactive' | 'suspended',
      },
      order: {
        joinedDate: 'DESC',
      },
    });

    return entities.map((entity) => CustomerPartnerMapper.toDomain(entity));
  }

  async countByPartnerId(partnerId: number): Promise<number> {
    return this.customerPartnerRepository.count({
      where: { partnerId },
    });
  }

  async countByPartnerIdAndStatus(partnerId: number, status: string): Promise<number> {
    return this.customerPartnerRepository.count({
      where: {
        partnerId,
        status: status as 'active' | 'inactive' | 'suspended',
      },
    });
  }

  async findByTenantId(tenantId: number): Promise<CustomerPartner[]> {
    const entities = await this.customerPartnerRepository.find({
      where: { tenantId },
      order: {
        joinedDate: 'DESC',
      },
    });

    return entities.map((entity) => CustomerPartnerMapper.toDomain(entity));
  }

  async findByUserIdAndPartnerIdAndStatus(
    userId: number,
    partnerId: number,
    status: string,
  ): Promise<CustomerPartner | null> {
    const entity = await this.customerPartnerRepository.findOne({
      where: {
        userId,
        partnerId,
        status: status as 'active' | 'inactive' | 'suspended',
      },
    });

    if (!entity) {
      return null;
    }

    return CustomerPartnerMapper.toDomain(entity);
  }

  async findCustomersByPartnerIdPaginated(
    partnerId: number,
    page: number,
    limit: number,
    status?: string,
  ): Promise<{ data: CustomerPartner[]; total: number }> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.customerPartnerRepository
      .createQueryBuilder('cp')
      .where('cp.partnerId = :partnerId', { partnerId })
      .skip(skip)
      .take(limit)
      .orderBy('cp.joinedDate', 'DESC');

    if (status) {
      queryBuilder.andWhere('cp.status = :status', { status });
    }

    const [entities, total] = await queryBuilder.getManyAndCount();
    const data = entities.map((entity) => CustomerPartnerMapper.toDomain(entity));

    return { data, total };
  }

  async findPartnersByUserIdPaginated(
    userId: number,
    page: number,
    limit: number,
    status?: string,
  ): Promise<{ data: CustomerPartner[]; total: number }> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.customerPartnerRepository
      .createQueryBuilder('cp')
      .where('cp.userId = :userId', { userId })
      .skip(skip)
      .take(limit)
      .orderBy('cp.joinedDate', 'DESC');

    if (status) {
      queryBuilder.andWhere('cp.status = :status', { status });
    }

    const [entities, total] = await queryBuilder.getManyAndCount();
    const data = entities.map((entity) => CustomerPartnerMapper.toDomain(entity));

    return { data, total };
  }
}
