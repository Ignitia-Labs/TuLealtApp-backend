import { Injectable, Inject } from '@nestjs/common';
import { ITransactionRepository } from '@libs/domain';
import { GetTransactionsRequest } from './get-transactions.request';
import { GetTransactionsResponse, TransactionDto } from './get-transactions.response';

/**
 * Handler para el caso de uso de obtener transacciones
 */
@Injectable()
export class GetTransactionsHandler {
  constructor(
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(request: GetTransactionsRequest): Promise<GetTransactionsResponse> {
    let transactions;

    // Si se proporciona membershipId, filtrar por membership
    if (request.membershipId) {
      if (request.type) {
        transactions = await this.transactionRepository.findByTypeAndMembershipId(
          request.membershipId,
          request.type,
        );
      } else {
        transactions = await this.transactionRepository.findByMembershipId(
          request.membershipId,
          request.skip || 0,
          request.take || 20,
        );
      }
    } else if (request.type) {
      // Filtrar por tipo y userId
      transactions = await this.transactionRepository.findByType(request.userId, request.type);
    } else {
      // Filtrar solo por userId
      transactions = await this.transactionRepository.findByUserId(
        request.userId,
        request.skip || 0,
        request.take || 20,
      );
    }

    const total = await this.transactionRepository.countByUserId(request.userId);

    const transactionDtos: TransactionDto[] = transactions.map(
      (transaction) =>
        new TransactionDto(
          transaction.id,
          transaction.userId,
          transaction.membershipId,
          transaction.type,
          transaction.points,
          transaction.description,
          transaction.metadata,
          transaction.status,
          transaction.createdAt,
          transaction.updatedAt,
          transaction.cashierId,
          transaction.transactionDate,
          transaction.transactionAmountTotal,
          transaction.netAmount,
          transaction.taxAmount,
          transaction.itemsCount,
          transaction.transactionReference,
          transaction.pointsEarned,
          transaction.pointsRuleId,
          transaction.pointsMultiplier,
          transaction.basePoints,
          transaction.bonusPoints,
        ),
    );

    return new GetTransactionsResponse(transactionDtos, total);
  }
}
