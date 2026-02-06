import { ApiProperty } from '@nestjs/swagger';
import { TopCustomerDto } from './top-customer-dto';
import { LoyaltyDashboardPointsTransactionDto } from './points-transaction-dto';
import { DailyActivityDto } from './daily-activity-dto';
import { PeriodDto } from './period-dto';

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

export class GetLoyaltyDashboardResponse {
  @ApiProperty({ example: 1500, description: 'Total de customers del tenant' })
  totalCustomers: number;

  @ApiProperty({ example: 1200, description: 'Total de customers activos' })
  activeCustomers: number;

  @ApiProperty({ example: 50000, description: 'Total de puntos de todas las memberships' })
  totalPoints: number;

  @ApiProperty({ example: 75000, description: 'Total de puntos ganados' })
  pointsEarned: number;

  @ApiProperty({ example: 25000, description: 'Total de puntos canjeados' })
  pointsRedeemed: number;

  @ApiProperty({ example: 150, description: 'Total de redemptions' })
  totalRedemptions: number;

  @ApiProperty({ example: 333.33, description: 'Promedio de puntos por customer' })
  avgPointsPerCustomer: number;

  @ApiProperty({ type: [TopRewardRuleDto], description: 'Top Reward Rules (reglas de recompensa)' })
  topRewards: TopRewardRuleDto[];

  @ApiProperty({ type: [TopCustomerDto], description: 'Top customers por puntos' })
  topCustomers: TopCustomerDto[];

  @ApiProperty({ type: [LoyaltyDashboardPointsTransactionDto], description: 'Transacciones recientes' })
  recentTransactions: LoyaltyDashboardPointsTransactionDto[];

  @ApiProperty({ example: '2025-01-28T10:00:00Z', description: 'Fecha de última actualización' })
  lastCalculatedAt: Date;

  @ApiProperty({
    type: [DailyActivityDto],
    description: 'Actividad diaria de los últimos 7 días',
  })
  dailyActivity: DailyActivityDto[];

  @ApiProperty({
    example: 5000,
    description: 'Total de puntos ganados en el período especificado',
  })
  pointsEarnedInPeriod: number;

  @ApiProperty({
    example: 2000,
    description: 'Total de puntos canjeados en el período especificado',
  })
  pointsRedeemedInPeriod: number;

  @ApiProperty({
    example: 25,
    description: 'Total de redemptions en el período especificado',
  })
  redemptionsInPeriod: number;

  @ApiProperty({
    example: 42.5,
    description: 'Tasa de retorno: (clientes con >=2 transacciones / total clientes con >=1 transacción) * 100',
  })
  returnRate: number;

  @ApiProperty({
    type: PeriodDto,
    description: 'Período de tiempo usado para los cálculos',
  })
  period: PeriodDto;

  constructor(
    totalCustomers: number,
    activeCustomers: number,
    totalPoints: number,
    pointsEarned: number,
    pointsRedeemed: number,
    totalRedemptions: number,
    avgPointsPerCustomer: number,
    topRewards: TopRewardRuleDto[],
    topCustomers: TopCustomerDto[],
    recentTransactions: LoyaltyDashboardPointsTransactionDto[],
    lastCalculatedAt: Date,
    dailyActivity: DailyActivityDto[],
    pointsEarnedInPeriod: number,
    pointsRedeemedInPeriod: number,
    redemptionsInPeriod: number,
    returnRate: number,
    period: PeriodDto,
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
    this.dailyActivity = dailyActivity;
    this.pointsEarnedInPeriod = pointsEarnedInPeriod;
    this.pointsRedeemedInPeriod = pointsRedeemedInPeriod;
    this.redemptionsInPeriod = redemptionsInPeriod;
    this.returnRate = returnRate;
    this.period = period;
  }
}
