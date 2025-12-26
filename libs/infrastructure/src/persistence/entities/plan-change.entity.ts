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
import { PartnerSubscriptionEntity } from './partner-subscription.entity';
import { PartnerEntity } from './partner.entity';

/**
 * Entidad de persistencia para PlanChange
 * Almacena el historial de cambios de plan
 */
@Entity('plan_changes')
@Index(['subscriptionId'])
@Index(['partnerId'])
@Index(['status'])
export class PlanChangeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PartnerSubscriptionEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: PartnerSubscriptionEntity;

  @Column('int')
  subscriptionId: number;

  @ManyToOne(() => PartnerEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerEntity;

  @Column('int')
  partnerId: number;

  @Column('varchar', { length: 100 })
  fromPlanId: string;

  @Column('varchar', { length: 20 })
  fromPlanType: 'esencia' | 'conecta' | 'inspira';

  @Column('varchar', { length: 100 })
  toPlanId: string;

  @Column('varchar', { length: 20 })
  toPlanType: 'esencia' | 'conecta' | 'inspira';

  @Column('varchar', { length: 20 })
  changeType: 'upgrade' | 'downgrade' | 'sidegrade';

  @Column('datetime')
  effectiveDate: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  proratedAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  creditIssued: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  additionalCharge: number;

  @Column('varchar', { length: 10, default: 'USD' })
  currency: string;

  @Column('varchar', { length: 20, default: 'pending' })
  status: 'pending' | 'completed' | 'cancelled' | 'failed';

  @Column('datetime', { nullable: true })
  processedAt: Date | null;

  @Column('text', { nullable: true })
  reason: string | null;

  @Column('int')
  requestedBy: number;

  @Column('int', { nullable: true })
  approvedBy: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

