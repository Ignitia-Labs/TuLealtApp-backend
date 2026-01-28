import { ApiProperty } from '@nestjs/swagger';
import { TopReward, TopCustomer, RecentTransaction } from '@libs/domain';

/**
 * Response DTO para estadísticas del dashboard de un tenant
 */
export class GetTenantDashboardStatsResponse {
  @ApiProperty({ description: 'Total de customers del tenant', example: 150 })
  totalCustomers: number;

  @ApiProperty({ description: 'Total de customers activos', example: 120 })
  activeCustomers: number;

  @ApiProperty({ description: 'Total de puntos de todas las memberships', example: 50000 })
  totalPoints: number;

  @ApiProperty({ description: 'Total de puntos ganados', example: 75000 })
  pointsEarned: number;

  @ApiProperty({ description: 'Total de puntos canjeados', example: 25000 })
  pointsRedeemed: number;

  @ApiProperty({ description: 'Total de redemptions', example: 150 })
  totalRedemptions: number;

  @ApiProperty({ description: 'Promedio de puntos por customer', example: 333.33 })
  avgPointsPerCustomer: number;

  @ApiProperty({
    description: 'Top rewards por número de redemptions',
    type: [Object],
    example: [
      {
        rewardId: 1,
        rewardName: 'Descuento 10%',
        redemptionsCount: 50,
        pointsRequired: 1000,
      },
    ],
  })
  topRewards: TopReward[];

  @ApiProperty({
    description: 'Top customers por puntos totales',
    type: [Object],
    example: [
      {
        userId: 1,
        membershipId: 1,
        points: 5000,
        totalRedemptions: 5,
      },
    ],
  })
  topCustomers: TopCustomer[];

  @ApiProperty({
    description: 'Transacciones recientes',
    type: [Object],
    example: [
      {
        id: 1,
        type: 'earn',
        points: 100,
        description: 'Compra realizada',
        createdAt: '2025-01-28T10:00:00Z',
      },
    ],
  })
  recentTransactions: RecentTransaction[];

  @ApiProperty({
    description: 'Fecha de última actualización de analytics',
    example: '2025-01-28T10:00:00Z',
  })
  lastCalculatedAt: Date;

  constructor(
    totalCustomers: number,
    activeCustomers: number,
    totalPoints: number,
    pointsEarned: number,
    pointsRedeemed: number,
    totalRedemptions: number,
    avgPointsPerCustomer: number,
    topRewards: TopReward[],
    topCustomers: TopCustomer[],
    recentTransactions: RecentTransaction[],
    lastCalculatedAt: Date,
  ) {
    this.totalCustomers = totalCustomers;
    this.activeCustomers = activeCustomers;
    this.totalPoints = totalPoints;
    this.pointsEarned = pointsEarned;
    this.pointsRedeemed = pointsRedeemed;
    this.totalRedemptions = totalRedemptions;
    this.avgPointsPerCustomer = avgPointsPerCustomer;
    this.topRewards = topRewards;
    this.topCustomers = topCustomers;
    this.recentTransactions = recentTransactions;
    this.lastCalculatedAt = lastCalculatedAt;
  }
}
