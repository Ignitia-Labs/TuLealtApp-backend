import { ApiProperty } from '@nestjs/swagger';
import { PointsTransaction } from '@libs/domain';

export class CreatePointsAdjustmentResponse {
  @ApiProperty({ example: 1001 })
  transactionId: number;

  @ApiProperty({ example: 'ADJUSTMENT' })
  type: string;

  @ApiProperty({ example: 100 })
  pointsDelta: number;

  @ApiProperty({ example: 'BONUS_BIRTHDAY' })
  reasonCode: string;

  @ApiProperty({ example: 100 })
  membershipId: number;

  @ApiProperty({ example: 500 })
  newBalance: number;

  @ApiProperty({ example: '2025-01-29T10:00:00Z' })
  createdAt: Date;

  constructor(transaction: PointsTransaction, newBalance: number) {
    this.transactionId = transaction.id;
    this.type = transaction.type;
    this.pointsDelta = transaction.pointsDelta;
    this.reasonCode = transaction.reasonCode || '';
    this.membershipId = transaction.membershipId;
    this.newBalance = newBalance;
    this.createdAt = transaction.createdAt;
  }
}
