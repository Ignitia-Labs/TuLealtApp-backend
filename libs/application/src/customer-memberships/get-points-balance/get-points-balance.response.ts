import { ApiProperty } from '@nestjs/swagger';

export class ExpiringPointsDto {
  @ApiProperty({ example: 100 })
  points: number;

  @ApiProperty({ example: '2025-02-15T00:00:00Z' })
  expiresAt: Date;
}

export class GetPointsBalanceResponse {
  @ApiProperty({ example: 100 })
  membershipId: number;

  @ApiProperty({ example: 500 })
  currentBalance: number;

  @ApiProperty({ example: 0 })
  pendingPoints: number;

  @ApiProperty({ type: [ExpiringPointsDto] })
  expiringSoon: ExpiringPointsDto[];

  @ApiProperty({ example: '2025-01-29T10:00:00Z' })
  lastUpdated: Date;

  constructor(
    membershipId: number,
    currentBalance: number,
    pendingPoints: number,
    expiringSoon: ExpiringPointsDto[],
    lastUpdated: Date,
  ) {
    this.membershipId = membershipId;
    this.currentBalance = currentBalance;
    this.pendingPoints = pendingPoints;
    this.expiringSoon = expiringSoon;
    this.lastUpdated = lastUpdated;
  }
}
