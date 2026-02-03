import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantEntity } from '@libs/infrastructure/entities/system/tenant.entity';

/**
 * Entidad de persistencia para TierPolicy
 */
@Entity('tier_policies')
export class TierPolicyEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TenantEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @Column('int')
  tenantId: number;

  @Column('varchar', { length: 20 })
  evaluationWindow: 'MONTHLY' | 'QUARTERLY' | 'ROLLING_30' | 'ROLLING_90';

  @Column('varchar', { length: 20 })
  evaluationType: 'FIXED' | 'ROLLING';

  @Column('json')
  thresholds: Record<string, number>; // { tierId: minPoints }

  @Column('int', { default: 30 })
  gracePeriodDays: number;

  @Column('int', { default: 0 })
  minTierDuration: number;

  @Column('varchar', { length: 20, default: 'GRACE_PERIOD' })
  downgradeStrategy: 'IMMEDIATE' | 'GRACE_PERIOD' | 'NEVER';

  @Column('varchar', { length: 20, default: 'draft' })
  status: 'active' | 'inactive' | 'draft';

  @Column('text', { nullable: true })
  description: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
