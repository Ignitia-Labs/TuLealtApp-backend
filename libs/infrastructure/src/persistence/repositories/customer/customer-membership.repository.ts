import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICustomerMembershipRepository, CustomerMembership, TopCustomer } from '@libs/domain';
import { CustomerMembershipEntity } from '@libs/infrastructure/entities/customer/customer-membership.entity';
import { CustomerMembershipMapper } from '@libs/infrastructure/mappers/customer/customer-membership.mapper';
import { PointsTransactionEntity } from '@libs/infrastructure/entities/loyalty/points-transaction.entity';

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
    // ⚠️ VALIDACIÓN CRÍTICA: No permitir actualización directa de points
    // El campo points es una proyección calculada desde el ledger
    // Solo se puede actualizar vía updateBalanceFromLedger()
    if (membership.id > 0) {
      // Es una actualización, verificar si se está intentando cambiar points
      const existingEntity = await this.membershipRepository.findOne({
        where: { id: membership.id },
      });

      if (existingEntity && existingEntity.points !== membership.points) {
        // Se está intentando actualizar points directamente
        // Ignorar el cambio y usar el valor actual de la BD
        console.warn(
          `⚠️ Attempted direct update of points for membership ${membership.id}. ` +
            `Ignoring points change. Use updateBalanceFromLedger() instead.`,
        );
        // Crear nueva instancia con points de la BD usando el mapper
        const existingMembership = CustomerMembershipMapper.toDomain(existingEntity);
        const correctedMembership = CustomerMembership.create(
          membership.userId,
          membership.tenantId,
          membership.registrationBranchId,
          existingMembership.points, // Usar points de la BD, no del objeto entrante
          membership.tierId,
          membership.totalSpent,
          membership.totalVisits,
          membership.lastVisit,
          membership.joinedDate,
          membership.qrCode,
          membership.status,
          membership.id,
        );
        const membershipEntity = CustomerMembershipMapper.toPersistence(correctedMembership);
        const savedEntity = await this.membershipRepository.save(membershipEntity);
        return CustomerMembershipMapper.toDomain(savedEntity);
      }
    }

    // Para nuevas memberships o actualizaciones sin cambio de points, proceder normalmente
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

  /**
   * Actualiza el balance de una membership desde el ledger
   * Este es el ÚNICO método permitido para actualizar customer_memberships.points
   */
  async updateBalanceFromLedger(
    membershipId: number,
    balance: number,
  ): Promise<CustomerMembership> {
    // Obtener membership actual
    const existingEntity = await this.membershipRepository.findOne({
      where: { id: membershipId },
    });

    if (!existingEntity) {
      throw new Error(`Membership with ID ${membershipId} not found`);
    }

    // Actualizar solo el campo points usando UPDATE directo
    await this.membershipRepository.update(membershipId, {
      points: Math.max(0, Math.round(balance)), // Asegurar que sea entero no negativo
    });

    // Retornar membership actualizada
    const updatedEntity = await this.membershipRepository.findOne({
      where: { id: membershipId },
    });

    if (!updatedEntity) {
      throw new Error(`Membership with ID ${membershipId} not found after update`);
    }

    return CustomerMembershipMapper.toDomain(updatedEntity);
  }

  async getTopCustomersByTenantId(tenantId: number, limit: number): Promise<TopCustomer[]> {
    // Transacciones eliminadas - retornar solo por puntos
    const results = await this.membershipRepository
      .createQueryBuilder('membership')
      .select([
        'membership.userId as userId',
        'membership.id as membershipId',
        'membership.points as points',
      ])
      .where('membership.tenantId = :tenantId', { tenantId })
      .orderBy('membership.points', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((result) => ({
      userId: result.userId,
      membershipId: result.membershipId,
      points: result.points,
      totalRedemptions: 0, // Ya no hay transacciones disponibles
    }));
  }

  async getTopCustomersWithStats(
    tenantId: number,
    limit: number,
  ): Promise<Array<{ userId: number; userName: string; points: number; transactions: number }>> {
    // Query optimizada con JOIN a users y LEFT JOIN manual a points_transactions para contar transacciones
    const results = await this.membershipRepository
      .createQueryBuilder('membership')
      .innerJoin('membership.user', 'user')
      .leftJoin(PointsTransactionEntity, 'pt', 'pt.membershipId = membership.id')
      .select([
        'membership.userId as userId',
        'user.name as userName',
        'membership.points as points',
        'COUNT(pt.id) as transactions',
      ])
      .where('membership.tenantId = :tenantId', { tenantId })
      .groupBy('membership.userId')
      .addGroupBy('user.name')
      .addGroupBy('membership.points')
      .orderBy('membership.points', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((result) => ({
      userId: Number(result.userId),
      userName: result.userName || 'Unknown',
      points: Number(result.points || 0),
      transactions: Number(result.transactions || 0),
    }));
  }

  async getNewCustomersByPeriod(
    tenantId: number,
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month',
  ): Promise<
    Array<{
      label: string;
      startDate: string;
      endDate: string;
      count: number;
      weekNumber?: number;
      monthName?: string;
    }>
  > {
    let dateFormat: string;
    let labelFormat: string;

    switch (groupBy) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        labelFormat = '%Y-%m-%d';
        break;
      case 'week':
        // YEARWEEK retorna año-semana (ej: 202601)
        dateFormat = 'YEARWEEK(cm.joinedDate, 1)';
        labelFormat = 'YEARWEEK(cm.joinedDate, 1)';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        labelFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
        labelFormat = '%Y-%m-%d';
    }

    // Query optimizada con agregación SQL
    const queryBuilder = this.membershipRepository
      .createQueryBuilder('cm')
      .where('cm.tenantId = :tenantId', { tenantId })
      .andWhere('cm.joinedDate >= :startDate', { startDate })
      .andWhere('cm.joinedDate <= :endDate', { endDate });

    if (groupBy === 'week') {
      queryBuilder
        .select([
          'YEARWEEK(cm.joinedDate, 1) as period',
          'MIN(cm.joinedDate) as startDate',
          'MAX(cm.joinedDate) as endDate',
          'COUNT(cm.id) as count',
        ])
        .groupBy('YEARWEEK(cm.joinedDate, 1)')
        .orderBy('YEARWEEK(cm.joinedDate, 1)', 'ASC');
    } else {
      queryBuilder
        .select([
          `DATE_FORMAT(cm.joinedDate, '${dateFormat}') as period`,
          `DATE_FORMAT(MIN(cm.joinedDate), '%Y-%m-%d') as startDate`,
          `DATE_FORMAT(MAX(cm.joinedDate), '%Y-%m-%d') as endDate`,
          'COUNT(cm.id) as count',
        ])
        .groupBy(`DATE_FORMAT(cm.joinedDate, '${dateFormat}')`)
        .orderBy('period', 'ASC');
    }

    const results = await queryBuilder.getRawMany();

    // Mapear resultados y generar etiquetas
    const monthNames = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];

    return results.map((row) => {
      let label = String(row.period || '');
      let weekNumber: number | undefined;
      let monthName: string | undefined;

      if (groupBy === 'week') {
        const periodStr = String(row.period);
        const year = parseInt(periodStr.substring(0, 4));
        const week = parseInt(periodStr.substring(4));
        weekNumber = week;
        label = `Sem ${week}`;
      } else if (groupBy === 'month') {
        const [year, month] = label.split('-');
        const monthNum = parseInt(month) - 1;
        monthName = monthNames[monthNum] || month;
        label = `${monthName} ${year}`;
      }

      return {
        label,
        startDate: String(row.startDate || ''),
        endDate: String(row.endDate || ''),
        count: Number(row.count || 0),
        weekNumber,
        monthName,
      };
    });
  }

  /**
   * Busca múltiples memberships por sus IDs (batch query)
   * Optimización para evitar N+1 queries
   */
  async findByIds(ids: number[]): Promise<CustomerMembership[]> {
    if (ids.length === 0) {
      return [];
    }

    const entities = await this.membershipRepository
      .createQueryBuilder('membership')
      .whereInIds(ids)
      .getMany();

    return entities.map((entity) => CustomerMembershipMapper.toDomain(entity));
  }
}
