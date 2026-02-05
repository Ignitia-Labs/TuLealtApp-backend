import { ApiProperty } from '@nestjs/swagger';
import { LoyaltyDashboardPointsTransactionDto } from '../../loyalty/get-loyalty-dashboard/points-transaction-dto';

export class GetTenantPointsTransactionsResponse {
  @ApiProperty({ type: [LoyaltyDashboardPointsTransactionDto], description: 'Lista de transacciones de puntos' })
  transactions: LoyaltyDashboardPointsTransactionDto[];

  @ApiProperty({ example: 150, description: 'Total de transacciones que cumplen los filtros' })
  total: number;

  @ApiProperty({ example: 1, description: 'Página actual' })
  page: number;

  @ApiProperty({ example: 20, description: 'Límite de resultados por página' })
  limit: number;

  constructor(transactions: LoyaltyDashboardPointsTransactionDto[], total: number, page: number, limit: number) {
    this.transactions = transactions;
    this.total = total;
    this.page = page;
    this.limit = limit;
  }
}
