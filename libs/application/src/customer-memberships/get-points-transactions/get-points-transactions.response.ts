import { ApiProperty } from '@nestjs/swagger';
import { PointsTransaction } from '@libs/domain';

export class PointsTransactionDto {
  @ApiProperty({ example: 1001 })
  id: number;

  @ApiProperty({
    example: 'EARNING',
    enum: ['EARNING', 'REDEEM', 'ADJUSTMENT', 'REVERSAL', 'EXPIRATION'],
  })
  type: string;

  @ApiProperty({ example: 15 })
  pointsDelta: number;

  @ApiProperty({ example: 'PURCHASE_BASE' })
  reasonCode: string;

  @ApiProperty({ example: 'ORDER-2025-01-29-001' })
  sourceEventId: string;

  @ApiProperty({ example: '2025-01-29T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-29T00:00:00Z', nullable: true })
  expiresAt: Date | null;

  @ApiProperty({ example: { orderId: 'ORDER-2025-01-29-001' }, nullable: true })
  metadata: Record<string, any> | null;
}

export class PointsTransactionsPaginationDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 150 })
  total: number;

  @ApiProperty({ example: 8 })
  totalPages: number;
}

export class GetPointsTransactionsResponse {
  @ApiProperty({ type: [PointsTransactionDto] })
  transactions: PointsTransactionDto[];

  @ApiProperty({ type: PointsTransactionsPaginationDto })
  pagination: PointsTransactionsPaginationDto;

  constructor(transactions: PointsTransaction[], total: number, page: number, limit: number) {
    this.transactions = transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      pointsDelta: tx.pointsDelta,
      reasonCode: tx.reasonCode,
      sourceEventId: tx.sourceEventId,
      createdAt: tx.createdAt,
      expiresAt: tx.expiresAt,
      metadata: tx.metadata,
    }));

    this.pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}
