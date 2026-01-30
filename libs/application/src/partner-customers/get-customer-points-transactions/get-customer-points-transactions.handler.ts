import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  IPointsTransactionRepository,
  ITenantRepository,
  PointsTransactionType,
} from '@libs/domain';
import { GetCustomerPointsTransactionsRequest } from './get-customer-points-transactions.request';
import { GetPointsTransactionsResponse } from '../../customer-memberships/get-points-transactions/get-points-transactions.response';

/**
 * Handler para obtener el historial de transacciones de puntos de un customer desde Partner API
 * Valida que el customer pertenezca al partner del usuario autenticado
 */
@Injectable()
export class GetCustomerPointsTransactionsHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(
    request: GetCustomerPointsTransactionsRequest,
    requestingPartnerId: number,
  ): Promise<GetPointsTransactionsResponse> {
    // Obtener membership
    const membership = await this.membershipRepository.findById(request.membershipId);
    if (!membership) {
      throw new NotFoundException(`Membership with ID ${request.membershipId} not found`);
    }

    // Verificar que el tenant pertenece al partner del usuario autenticado
    const tenant = await this.tenantRepository.findById(membership.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${membership.tenantId} not found`);
    }

    if (tenant.partnerId !== requestingPartnerId) {
      throw new ForbiddenException('Customer does not belong to your partner');
    }

    // Obtener todas las transacciones de la membership
    let transactions;
    if (request.type && request.type !== 'all') {
      transactions = await this.pointsTransactionRepository.findByMembershipIdAndType(
        request.membershipId,
        request.type as PointsTransactionType,
      );
    } else {
      transactions = await this.pointsTransactionRepository.findByMembershipId(
        request.membershipId,
      );
    }

    // Filtrar por fecha si se proporciona
    if (request.fromDate || request.toDate) {
      const fromDate = request.fromDate ? new Date(request.fromDate) : null;
      const toDate = request.toDate ? new Date(request.toDate) : null;

      transactions = transactions.filter((tx) => {
        const txDate = tx.createdAt;
        if (fromDate && txDate < fromDate) {
          return false;
        }
        if (toDate && txDate > toDate) {
          return false;
        }
        return true;
      });
    }

    // Ordenar por fecha descendente (más recientes primero)
    transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Paginación manual (se puede mejorar con paginación en BD)
    const page = request.page || 1;
    const limit = request.limit || 20;
    const total = transactions.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    return new GetPointsTransactionsResponse(paginatedTransactions, total, page, limit);
  }
}
