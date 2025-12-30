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
import { InvoiceEntity } from './invoice.entity';
import { BillingCycleEntity } from './billing-cycle.entity';

/**
 * Entidad de persistencia para Payment
 * Almacena los pagos realizados
 */
@Entity('payments')
@Index(['subscriptionId'])
@Index(['partnerId'])
@Index(['invoiceId'])
@Index(['status'])
@Index(['transactionId']) // Índice normal para mejorar búsquedas (la unicidad se valida a nivel de aplicación)
export class PaymentEntity {
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

  @ManyToOne(() => InvoiceEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice: InvoiceEntity | null;

  @Column('int', { nullable: true })
  invoiceId: number | null;

  @ManyToOne(() => BillingCycleEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'billingCycleId' })
  billingCycle: BillingCycleEntity | null;

  @Column('int', { nullable: true })
  billingCycleId: number | null;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('varchar', { length: 10, default: 'USD' })
  currency: string;

  @Column('varchar', { length: 50 })
  paymentMethod: 'credit_card' | 'bank_transfer' | 'cash' | 'other';

  @Column('varchar', { length: 20, default: 'pending' })
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';

  @Column('datetime')
  paymentDate: Date;

  @Column('datetime', { nullable: true })
  processedDate: Date | null;

  @Column('int', { nullable: true })
  transactionId: number | null;

  @Column('varchar', { length: 100, nullable: true })
  reference: string | null;

  @Column('varchar', { length: 100, nullable: true })
  confirmationCode: string | null;

  @Column('varchar', { length: 50, nullable: true })
  gateway: string | null;

  @Column('varchar', { length: 100, nullable: true })
  gatewayTransactionId: string | null;

  @Column('varchar', { length: 4, nullable: true })
  cardLastFour: string | null;

  @Column('varchar', { length: 50, nullable: true })
  cardBrand: string | null;

  @Column('varchar', { length: 7, nullable: true })
  cardExpiry: string | null;

  @Column('boolean', { default: false })
  isRetry: boolean;

  @Column('int', { nullable: true })
  retryAttempt: number | null;

  @Column('text', { nullable: true })
  notes: string | null;

  @Column('int', { nullable: true })
  processedBy: number | null;

  @Column('int', { nullable: true })
  originalPaymentId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

