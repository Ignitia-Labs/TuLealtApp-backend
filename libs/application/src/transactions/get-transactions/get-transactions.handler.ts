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

    if (request.type) {
      transactions = await this.transactionRepository.findByType(request.userId, request.type);
    } else {
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
          transaction.type,
          transaction.points,
          transaction.description,
          transaction.metadata,
          transaction.status,
          transaction.createdAt,
          transaction.updatedAt,
        ),
    );

    return new GetTransactionsResponse(transactionDtos, total);
  }
}

