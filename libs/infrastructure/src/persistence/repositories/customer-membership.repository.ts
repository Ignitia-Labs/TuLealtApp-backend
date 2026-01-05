import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICustomerMembershipRepository, CustomerMembership } from '@libs/domain';
import { CustomerMembershipEntity } from '../entities/customer-membership.entity';
import { CustomerMembershipMapper } from '../mappers/customer-membership.mapper';

/**
 * Implementación del repositorio de customer memberships usando TypeORM
 */
@Injectable()
export class CustomerMembershipRepository implements ICustomerMembershipRepository {
  constructor(
    @InjectRepository(CustomerMembershipEntity)
    private readonly membershipRepository: Repository<CustomerMembershipEntity>,
  ) {}

  async findById(id: number): Promise<CustomerMembership | null> {
    const membershipEntity = await this.membershipRepository.findOne({
      where: { id },
    });

    if (!membershipEntity) {
      return null;
    }

    return CustomerMembershipMapper.toDomain(membershipEntity);
  }

  async findByUserId(userId: number): Promise<CustomerMembership[]> {
    const membershipEntities = await this.membershipRepository.find({
      where: { userId },
      order: {
        joinedDate: 'DESC',
      },
    });

    return membershipEntities.map((entity) => CustomerMembershipMapper.toDomain(entity));
  }

  async findActiveByUserId(userId: number): Promise<CustomerMembership[]> {
    const membershipEntities = await this.membershipRepository.find({
      where: {
        userId,
        status: 'active',
      },
      order: {
        joinedDate: 'DESC',
      },
    });

    return membershipEntities.map((entity) => CustomerMembershipMapper.toDomain(entity));
  }

  async findByTenantId(tenantId: number): Promise<CustomerMembership[]> {
    const membershipEntities = await this.membershipRepository.find({
      where: { tenantId },
      order: {
        joinedDate: 'DESC',
      },
    });

    return membershipEntities.map((entity) => CustomerMembershipMapper.toDomain(entity));
  }

  async findByUserIdAndTenantId(
    userId: number,
    tenantId: number,
  ): Promise<CustomerMembership | null> {
    const membershipEntity = await this.membershipRepository.findOne({
      where: {
        userId,
        tenantId,
      },
    });

    if (!membershipEntity) {
      return null;
    }

    return CustomerMembershipMapper.toDomain(membershipEntity);
  }

  async findByQrCode(qrCode: string): Promise<CustomerMembership | null> {
    const membershipEntity = await this.membershipRepository.findOne({
      where: { qrCode },
    });

    if (!membershipEntity) {
      return null;
    }

    return CustomerMembershipMapper.toDomain(membershipEntity);
  }

  async save(membership: CustomerMembership): Promise<CustomerMembership> {
    const membershipEntity = CustomerMembershipMapper.toPersistence(membership);
    const savedEntity = await this.membershipRepository.save(membershipEntity);
    return CustomerMembershipMapper.toDomain(savedEntity);
  }

  async update(membership: CustomerMembership): Promise<CustomerMembership> {
    const membershipEntity = CustomerMembershipMapper.toPersistence(membership);
    const updatedEntity = await this.membershipRepository.save(membershipEntity);
    return CustomerMembershipMapper.toDomain(updatedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.membershipRepository.delete(id);
  }

  async countByTenantId(tenantId: number): Promise<number> {
    return this.membershipRepository.count({
      where: { tenantId },
    });
  }
}
