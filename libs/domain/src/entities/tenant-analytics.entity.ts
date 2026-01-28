/**
 * Entidad de dominio TenantAnalytics
 * Representa las estadísticas pre-calculadas de un tenant
 * No depende de frameworks ni librerías externas
 */

export interface TopReward {
  rewardId: number;
  rewardName: string;
  redemptionsCount: number;
  pointsRequired: number;
}

export interface TopCustomer {
  userId: number;
  membershipId: number;
  points: number;
  totalRedemptions: number;
}

export interface RecentTransaction {
  id: number;
  type: 'earn' | 'redeem' | 'expire' | 'adjust';
  points: number;
  description: string;
  createdAt: Date;
}

export class TenantAnalytics {
  constructor(
    public readonly tenantId: number,
    public readonly totalCustomers: number,
    public readonly activeCustomers: number,
    public readonly totalPoints: number,
    public readonly pointsEarned: number,
    public readonly pointsRedeemed: number,
    public readonly totalRedemptions: number,
    public readonly avgPointsPerCustomer: number,
    public readonly topRewards: TopReward[],
    public readonly topCustomers: TopCustomer[],
    public readonly recentTransactions: RecentTransaction[],
    public readonly lastCalculatedAt: Date,
    public readonly calculationDurationMs: number | null,
    public readonly version: number,
    public readonly id?: number,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  /**
   * Factory method para crear analytics de tenant
   */
  static create(
    tenantId: number,
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
    calculationDurationMs: number | null = null,
    version: number = 1,
    id?: number,
  ): TenantAnalytics {
    const now = new Date();
    return new TenantAnalytics(
      tenantId,
      totalCustomers,
      activeCustomers,
      totalPoints,
      pointsEarned,
      pointsRedeemed,
      totalRedemptions,
      avgPointsPerCustomer,
      topRewards,
      topCustomers,
      recentTransactions,
      now,
      calculationDurationMs,
      version,
      id,
      now,
      now,
    );
  }

  /**
   * Calcula el promedio de puntos por customer
   */
  static calculateAvgPointsPerCustomer(totalPoints: number, totalCustomers: number): number {
    if (totalCustomers === 0) {
      return 0;
    }
    return Math.round((totalPoints / totalCustomers) * 100) / 100; // Redondear a 2 decimales
  }
}
