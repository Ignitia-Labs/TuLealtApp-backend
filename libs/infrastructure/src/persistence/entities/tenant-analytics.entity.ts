import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TenantEntity } from './tenant.entity';
import { TopReward, TopCustomer, RecentTransaction } from '@libs/domain';

/**
 * Entidad de persistencia para TenantAnalytics
 * Mapea la entidad de dominio TenantAnalytics a la tabla de base de datos
 */
@Entity('tenant_analytics')
@Index('UK_tenant_analytics_tenantId', ['tenantId'], { unique: true })
@Index('IDX_tenant_analytics_lastCalculatedAt', ['lastCalculatedAt'])
export class TenantAnalyticsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TenantEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @Column('int')
  tenantId: number;

  // Métricas de Customers
  @Column('int', { default: 0 })
  totalCustomers: number;

  @Column('int', { default: 0 })
  activeCustomers: number;

  // Métricas de Puntos
  @Column('bigint', { default: 0 })
  totalPoints: number;

  @Column('bigint', { default: 0 })
  pointsEarned: number;

  @Column('bigint', { default: 0 })
  pointsRedeemed: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  avgPointsPerCustomer: number;

  // Métricas de Redemptions
  @Column('int', { default: 0 })
  totalRedemptions: number;

  // Top Rewards (JSON)
  @Column('json', { default: '[]' })
  topRewards: TopReward[];

  // Top Customers (JSON)
  @Column('json', { default: '[]' })
  topCustomers: TopCustomer[];

  // Recent Transactions (JSON)
  @Column('json', { default: '[]' })
  recentTransactions: RecentTransaction[];

  // Metadata de actualización
  @Column('datetime', { default: () => 'CURRENT_TIMESTAMP' })
  lastCalculatedAt: Date;

  @Column('int', { nullable: true })
  calculationDurationMs: number | null;

  @Column('int', { default: 1 })
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
