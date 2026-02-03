import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { PartnerSubscriptionEntity } from '@libs/infrastructure/entities/partner/partner-subscription.entity';
import { PartnerEntity } from '@libs/infrastructure/entities/partner/partner.entity';

/**
 * Entidad de persistencia para SubscriptionEvent
 * Almacena el historial de eventos de suscripciones
 */
@Entity('subscription_events')
@Index(['subscriptionId'])
@Index(['partnerId'])
@Index(['type'])
@Index(['occurredAt'])
export class SubscriptionEventEntity {
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
    | 'created'
    | 'activated'
    | 'suspended'
    | 'cancelled'
    | 'renewed'
    | 'payment_received'
    | 'payment_failed'
    | 'payment_retry'
    | 'plan_changed'
    | 'plan_upgraded'
    | 'plan_downgraded'
    | 'paused'
    | 'resumed'
    | 'expired'
    | 'trial_started'
    | 'trial_ended'
    | 'invoice_generated'
    | 'refund_issued'
    | 'credit_applied'
    | 'limit_reached'
    | 'usage_alert'
    | 'custom';

  @Column('varchar', { length: 255 })
  title: string;

  @Column('text')
  description: string;

  @Column('int', { nullable: true })
  paymentId: number | null;

  @Column('int', { nullable: true })
  invoiceId: number | null;

  @Column('json', { nullable: true })
  metadata: Record<string, any> | null;

  @Column('datetime')
  occurredAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
