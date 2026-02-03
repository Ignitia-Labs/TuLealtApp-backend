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
import { PartnerSubscriptionEntity } from '@libs/infrastructure/entities/partner/partner-subscription.entity';
import { PartnerEntity } from '@libs/infrastructure/entities/partner/partner.entity';

/**
 * Entidad de persistencia para SubscriptionAlert
 * Almacena las alertas relacionadas con suscripciones
 */
@Entity('subscription_alerts')
@Index(['subscriptionId'])
@Index(['partnerId'])
@Index(['status'])
@Index(['severity'])
export class SubscriptionAlertEntity {
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

  @Column('varchar', { length: 50 })
  type:
    | 'renewal'
    | 'payment_failed'
    | 'payment_due'
    | 'usage_warning'
    | 'limit_reached'
    | 'trial_ending'
    | 'expiring'
    | 'custom';

  @Column('varchar', { length: 20 })
  severity: 'info' | 'warning' | 'critical';

  @Column('varchar', { length: 255 })
  title: string;

  @Column('text')
  message: string;

  @Column('boolean', { default: false })
  actionRequired: boolean;

  @Column('varchar', { length: 255, nullable: true })
  actionLabel: string | null;

  @Column('varchar', { length: 500, nullable: true })
  actionUrl: string | null;

  @Column('varchar', { length: 20, default: 'active' })
  status: 'active' | 'dismissed' | 'resolved';

  @Column('boolean', { default: true })
  notifyEmail: boolean;

  @Column('boolean', { default: true })
  notifyPush: boolean;

  @Column('datetime', { nullable: true })
  emailSentAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
