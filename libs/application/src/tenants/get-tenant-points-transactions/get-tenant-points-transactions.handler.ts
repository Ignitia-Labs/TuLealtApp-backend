import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ITenantRepository, IPointsTransactionRepository } from '@libs/domain';
import { GetTenantPointsTransactionsRequest } from './get-tenant-points-transactions.request';
import { GetTenantPointsTransactionsResponse } from './get-tenant-points-transactions.response';
import { LoyaltyDashboardPointsTransactionDto } from '../../loyalty/get-loyalty-dashboard/points-transaction-dto';

/**
 * Handler para obtener transacciones de puntos de un tenant
 * Optimizado con queries SQL eficientes usando JOINs
 */
@Injectable()
export class GetTenantPointsTransactionsHandler {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
  ) {}

  async execute(
    request: GetTenantPointsTransactionsRequest,
  ): Promise<GetTenantPointsTransactionsResponse> {
    // Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Preparar filtros
    const filters: {
      type?: 'EARNING' | 'REDEEM' | 'ADJUSTMENT' | 'REVERSAL' | 'EXPIRATION' | 'all';
      fromDate?: Date;
      toDate?: Date;
      page?: number;
      limit?: number;
    } = {
      page: request.page || 1,
      limit: request.limit || 20,
    };

    if (request.type && request.type !== 'all') {
      filters.type = request.type;
    }

    if (request.fromDate) {
      filters.fromDate = new Date(request.fromDate);
    }

    if (request.toDate) {
      filters.toDate = new Date(request.toDate);
    }

    // Obtener transacciones usando método optimizado del repositorio
    const result = await this.pointsTransactionRepository.findByTenantIdPaginated(
      request.tenantId,
      filters,
    );

    // Convertir a DTOs
    const transactionsDto: LoyaltyDashboardPointsTransactionDto[] = result.transactions.map(
      (tx) =>
        new LoyaltyDashboardPointsTransactionDto(
          tx.id,
          tx.type,
          tx.pointsDelta,
          tx.reasonCode,
          tx.sourceEventId,
          tx.createdAt,
          tx.expiresAt,
          tx.metadata,
          tx.programId,
          tx.rewardRuleId,
          tx.membershipId,
        ),
    );

    return new GetTenantPointsTransactionsResponse(
      transactionsDto,
      result.total,
      filters.page!,
      filters.limit!,
    );
  }
}
