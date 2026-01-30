import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  IPointsTransactionRepository,
  PointsTransactionType,
} from '@libs/domain';
import { GetPointsTransactionsRequest } from './get-points-transactions.request';
import { GetPointsTransactionsResponse } from './get-points-transactions.response';

/**
 * Handler para obtener el historial de transacciones de puntos de una membership
 * Nota: Por ahora obtiene todas las transacciones y filtra en memoria
 * Se puede optimizar agregando paginación en el repositorio
 */
@Injectable()
export class GetPointsTransactionsHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
  ) {}

  async execute(
    request: GetPointsTransactionsRequest,
    userId: number,
  ): Promise<GetPointsTransactionsResponse> {
    // Obtener membership y validar ownership
    const membership = await this.membershipRepository.findById(request.membershipId);
    if (!membership) {
      throw new NotFoundException(`Membership with ID ${request.membershipId} not found`);
    }

    // Validar que la membership pertenece al usuario
    if (membership.userId !== userId) {
      throw new NotFoundException(
        `Membership ${request.membershipId} does not belong to user ${userId}`,
      );
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
