import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PartnerSubscriptionEntity } from '@libs/infrastructure/entities/partner/partner-subscription.entity';
import { PartnerEntity } from '@libs/infrastructure/entities/partner/partner.entity';
import { BillingCycleEntity } from '@libs/infrastructure/entities/billing/billing-cycle.entity';
import { InvoiceItemEntity } from '@libs/infrastructure/entities/billing/invoice-item.entity';

/**
 * Entidad de persistencia para Invoice
 * Almacena las facturas generadas
 */
@Entity('invoices')
@Index(['subscriptionId'])
@Index(['partnerId'])
@Index(['status'])
export class InvoiceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 100, unique: true })
  invoiceNumber: string;

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

  @ManyToOne(() => BillingCycleEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'billingCycleId' })
  billingCycle: BillingCycleEntity | null;

  @Column('int', { nullable: true })
  billingCycleId: number | null;

  @Column('varchar', { length: 255 })
  businessName: string;

  @Column('varchar', { length: 100 })
  taxId: string;

  @Column('text')
  fiscalAddress: string;

  @Column('varchar', { length: 255 })
  billingEmail: string;

  @Column('datetime')
  issueDate: Date;

  @Column('datetime')
  dueDate: Date;

  @Column('datetime', { nullable: true })
  paidDate: Date | null;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  taxAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  creditApplied: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column('varchar', { length: 10, default: 'USD' })
  currency: string;

  @OneToMany(() => InvoiceItemEntity, (item) => item.invoice, {
    cascade: true,
    eager: false,
  })
  items: InvoiceItemEntity[];

  @Column('varchar', { length: 20, default: 'pending' })
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';

  @Column('varchar', { length: 20, default: 'pending' })
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';

  @Column('varchar', { length: 50, nullable: true })
  paymentMethod: 'credit_card' | 'bank_transfer' | 'cash' | 'other' | null; // InvoicePaymentMethod

  @Column('text', { nullable: true })
  pdfUrl: string | null;

  @Column('text', { nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
