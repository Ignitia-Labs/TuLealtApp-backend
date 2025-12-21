import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PartnerEntity } from './partner.entity';

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

  @Column('datetime')
  startDate: Date;

  @Column('datetime')
  renewalDate: Date;

  @Column('varchar', { length: 20, default: 'active' })
  status: 'active' | 'expired' | 'suspended' | 'cancelled';

  @Column('datetime', { nullable: true })
  lastPaymentDate: Date | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  lastPaymentAmount: number | null;

  @Column('varchar', { length: 20, nullable: true })
  paymentStatus: 'paid' | 'pending' | 'failed' | null;

  @Column('boolean', { default: true })
  autoRenew: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
