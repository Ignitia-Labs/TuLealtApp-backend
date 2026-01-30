import { ApiProperty } from '@nestjs/swagger';
import { PointsTransaction } from '@libs/domain';

export class CreatePointsReversalResponse {
  @ApiProperty({ example: 1002 })
  reversalTransactionId: number;

  @ApiProperty({ example: 1001 })
  originalTransactionId: number;

  @ApiProperty({ example: 'REVERSAL' })
  type: string;

  @ApiProperty({ example: -15 })
  pointsDelta: number;

  @ApiProperty({ example: 'REFUND' })
  reasonCode: string;

  @ApiProperty({ example: 100 })
  membershipId: number;

  @ApiProperty({ example: 485 })
  newBalance: number;

  @ApiProperty({ example: '2025-01-29T10:00:00Z' })
  createdAt: Date;

  constructor(
    reversalTransaction: PointsTransaction,
    originalTransactionId: number,
    newBalance: number,
  ) {
    this.reversalTransactionId = reversalTransaction.id;
    this.originalTransactionId = originalTransactionId;
    this.type = reversalTransaction.type;
    this.pointsDelta = reversalTransaction.pointsDelta;
    this.reasonCode = reversalTransaction.reasonCode || '';
    this.membershipId = reversalTransaction.membershipId;
    this.newBalance = newBalance;
    this.createdAt = reversalTransaction.createdAt;
  }
}
