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
 * Entidad de persistencia para BillingCycle
 * Almacena los ciclos de facturación de suscripciones
 */
@Entity('billing_cycles')
@Index(['subscriptionId'])
@Index(['partnerId'])
@Index(['status'])
export class BillingCycleEntity {
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

  @Column('int')
  cycleNumber: number;

  @Column('datetime')
  startDate: Date;

  @Column('datetime')
  endDate: Date;

  @Column('int')
  durationDays: number;

  @Column('datetime')
  billingDate: Date;

  @Column('datetime')
  dueDate: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column('varchar', { length: 10, default: 'USD' })
  currency: string;

  @Column('varchar', { length: 20, default: 'pending' })
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';

  @Column('varchar', { length: 20, default: 'pending' })
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';

  @Column('datetime', { nullable: true })
  paymentDate: Date | null;

  @Column('varchar', { length: 50, nullable: true })
  paymentMethod: string | null;

  @Column('varchar', { length: 100, nullable: true })
  invoiceId: string | null;

  @Column('varchar', { length: 100, nullable: true })
  invoiceNumber: string | null;

  @Column('varchar', { length: 20, nullable: true })
  invoiceStatus: 'pending' | 'paid' | 'overdue' | 'cancelled' | null; // BillingCycleInvoiceStatus

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  discountApplied: number | null;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
