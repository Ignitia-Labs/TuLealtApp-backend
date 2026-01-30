import { ApiProperty } from '@nestjs/swagger';

export class TopRewardRuleDto {
  @ApiProperty({ example: 1 })
  ruleId: number;

  @ApiProperty({ example: 'Recompensa por Compra' })
  name: string;

  @ApiProperty({ example: 25000 })
  pointsAwarded: number;

  @ApiProperty({ example: 500 })
  transactionsCount: number;
}

export class RecentActivityDto {
  @ApiProperty({ example: 1001 })
  transactionId: number;

  @ApiProperty({ example: 'EARNING' })
  type: string;

  @ApiProperty({ example: 15 })
  pointsDelta: number;

  @ApiProperty({ example: 'PURCHASE_BASE' })
  reasonCode: string;

  @ApiProperty({ example: '2025-01-29T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: 100 })
  membershipId: number;
}

export class GetLoyaltyDashboardResponse {
  @ApiProperty({ example: 1500 })
  totalCustomers: number;

  @ApiProperty({ example: 1200 })
  activeCustomers: number;

  @ApiProperty({ example: 50000 })
  totalPointsIssued: number;

  @ApiProperty({ example: 20000 })
  totalPointsRedeemed: number;

  @ApiProperty({ example: 30000 })
  activePoints: number;

  @ApiProperty({ type: [TopRewardRuleDto] })
  topRewards: TopRewardRuleDto[];

  @ApiProperty({ type: [RecentActivityDto] })
  recentActivity: RecentActivityDto[];

  constructor(
    totalCustomers: number,
    activeCustomers: number,
    totalPointsIssued: number,
    totalPointsRedeemed: number,
    activePoints: number,
    topRewards: TopRewardRuleDto[],
    recentActivity: RecentActivityDto[],
  ) {
    this.totalCustomers = totalCustomers;
    this.activeCustomers = activeCustomers;
    this.totalPointsIssued = totalPointsIssued;
    this.totalPointsRedeemed = totalPointsRedeemed;
    this.activePoints = activePoints;
    this.topRewards = topRewards;
    this.recentActivity = recentActivity;
  }
}
