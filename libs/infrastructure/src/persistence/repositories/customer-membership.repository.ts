import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICustomerMembershipRepository, CustomerMembership, TopCustomer } from '@libs/domain';
import { CustomerMembershipEntity } from '../entities/customer-membership.entity';
import { CustomerMembershipMapper } from '../mappers/customer-membership.mapper';
import { TransactionEntity } from '../entities/transaction.entity';

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

  async findByUserIdAndStatus(
    userId: number,
    status: 'active' | 'inactive',
  ): Promise<CustomerMembership[]> {
    const membershipEntities = await this.membershipRepository.find({
      where: {
        userId,
        status,
      },
      order: {
        joinedDate: 'DESC',
      },
    });

    return membershipEntities.map((entity) => CustomerMembershipMapper.toDomain(entity));
  }

  async findCustomersByPartnerIdPaginated(
    partnerId: number,
    page: number,
    limit: number,
    status?: 'active' | 'inactive' | 'suspended',
  ): Promise<{ data: CustomerMembership[]; total: number }> {
    // Hacer JOIN con tenants usando la relación de TypeORM para filtrar por partnerId
    // Esto asegura que solo se retornen customers asociados a tenants del partner
    // Seleccionar explícitamente todos los campos de membership para evitar problemas con JOINs
    const queryBuilder = this.membershipRepository
      .createQueryBuilder('membership')
      .select([
        'membership.id',
        'membership.userId',
        'membership.tenantId',
        'membership.registrationBranchId',
        'membership.points',
        'membership.tierId',
        'membership.totalSpent',
        'membership.totalVisits',
        'membership.lastVisit',
        'membership.joinedDate',
        'membership.qrCode',
        'membership.status',
        'membership.createdAt',
        'membership.updatedAt',
      ])
      .innerJoin('membership.tenant', 'tenant')
      .where('tenant.partnerId = :partnerId', { partnerId })
      .orderBy('membership.joinedDate', 'DESC');

    // Filtrar por status si se proporciona
    // Nota: customer_memberships solo tiene 'active' | 'inactive', no 'suspended'
    if (status) {
      if (status === 'suspended') {
        // Suspended no existe en memberships, retornar vacío
        return { data: [], total: 0 };
      }
      queryBuilder.andWhere('membership.status = :status', { status });
    }

    // Obtener total antes de aplicar paginación
    const total = await queryBuilder.getCount();

    // Paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Obtener datos
    const membershipEntities = await queryBuilder.getMany();

    const data = membershipEntities.map((entity) => CustomerMembershipMapper.toDomain(entity));

    return { data, total };
  }

  async findCustomersByPartnerId(
    partnerId: number,
    status?: 'active' | 'inactive' | 'suspended',
  ): Promise<CustomerMembership[]> {
    // Hacer JOIN con tenants usando la relación de TypeORM para filtrar por partnerId
    // Esto asegura que solo se retornen customers asociados a tenants del partner
    // Seleccionar explícitamente todos los campos de membership para evitar problemas con JOINs
    const queryBuilder = this.membershipRepository
      .createQueryBuilder('membership')
      .select([
        'membership.id',
        'membership.userId',
        'membership.tenantId',
        'membership.registrationBranchId',
        'membership.points',
        'membership.tierId',
        'membership.totalSpent',
        'membership.totalVisits',
        'membership.lastVisit',
        'membership.joinedDate',
        'membership.qrCode',
        'membership.status',
        'membership.createdAt',
        'membership.updatedAt',
      ])
      .innerJoin('membership.tenant', 'tenant')
      .where('tenant.partnerId = :partnerId', { partnerId })
      .orderBy('membership.joinedDate', 'DESC');

    // Filtrar por status si se proporciona
    if (status) {
      if (status === 'suspended') {
        // Suspended no existe en memberships, retornar vacío
        return [];
      }
      queryBuilder.andWhere('membership.status = :status', { status });
    }

    // Obtener todos los datos sin paginación
    const membershipEntities = await queryBuilder.getMany();

    return membershipEntities.map((entity) => CustomerMembershipMapper.toDomain(entity));
  }

  async countByTenantIdAndStatus(tenantId: number, status: 'active' | 'inactive'): Promise<number> {
    return this.membershipRepository.count({
      where: { tenantId, status },
    });
  }

  async getTopCustomersByTenantId(tenantId: number, limit: number): Promise<TopCustomer[]> {
    const results = await this.membershipRepository
      .createQueryBuilder('membership')
      .leftJoin(
        TransactionEntity,
        'transaction',
        'transaction.membershipId = membership.id AND transaction.type = :redeemType AND transaction.status = :completedStatus',
        { redeemType: 'redeem', completedStatus: 'completed' },
      )
      .select([
        'membership.userId as userId',
        'membership.id as membershipId',
        'membership.points as points',
        'COUNT(DISTINCT transaction.id) as totalRedemptions',
      ])
      .where('membership.tenantId = :tenantId', { tenantId })
      .groupBy('membership.id')
      .orderBy('membership.points', 'DESC')
      .addOrderBy('totalRedemptions', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((result) => ({
      userId: result.userId,
      membershipId: result.membershipId,
      points: result.points,
      totalRedemptions: parseInt(result.totalRedemptions || '0', 10),
    }));
  }
}
