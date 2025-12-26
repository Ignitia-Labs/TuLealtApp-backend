import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PartnerEntity } from './partner.entity';
import { PartnerSubscriptionUsageEntity } from './partner-subscription-usage.entity';

/**
 * Entidad de persistencia para PartnerSubscription
 * Almacena la suscripción de un partner
 */
@Entity('partner_subscriptions')
export class PartnerSubscriptionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PartnerEntity, (partner) => partner.subscription, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerEntity;

  @Column('int')
  partnerId: number;

  @Column('varchar', { length: 100 })
  planId: string;

  @Column('varchar', { length: 20 })
  planType: 'esencia' | 'conecta' | 'inspira';

  @Column('datetime')
  startDate: Date;

  @Column('datetime')
  renewalDate: Date;

  @Column('varchar', { length: 20, default: 'active' })
  status: 'active' | 'expired' | 'suspended' | 'cancelled' | 'trialing' | 'past_due' | 'paused';

  @Column('varchar', { length: 20 })
  billingFrequency: 'monthly' | 'quarterly' | 'semiannual' | 'annual';

  @Column('decimal', { precision: 10, scale: 2 })
  billingAmount: number;

  @Column('varchar', { length: 10, default: 'USD' })
  currency: string;

  @Column('datetime')
  nextBillingDate: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  nextBillingAmount: number;

  @Column('datetime')
  currentPeriodStart: Date;

  @Column('datetime')
  currentPeriodEnd: Date;

  @Column('datetime', { nullable: true })
  trialEndDate: Date | null;

  @Column('datetime', { nullable: true })
  pausedAt: Date | null;

  @Column('text', { nullable: true })
  pauseReason: string | null;

  @Column('int', { default: 7 })
  gracePeriodDays: number;

  @Column('int', { default: 0 })
  retryAttempts: number;

  @Column('int', { default: 3 })
  maxRetryAttempts: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  creditBalance: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  discountPercent: number | null;

  @Column('varchar', { length: 50, nullable: true })
  discountCode: string | null;

  @Column('datetime', { nullable: true })
  lastPaymentDate: Date | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  lastPaymentAmount: number | null;

  @Column('varchar', { length: 20, nullable: true })
  paymentStatus: 'paid' | 'pending' | 'failed' | null;

  @Column('boolean', { default: true })
  autoRenew: boolean;

  // Relations
  @OneToOne(() => PartnerSubscriptionUsageEntity, (usage) => usage.partnerSubscription, {
    cascade: true,
    eager: false,
    nullable: true,
  })
  usage: PartnerSubscriptionUsageEntity | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
