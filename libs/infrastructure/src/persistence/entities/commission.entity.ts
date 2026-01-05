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
import { PartnerEntity } from './partner.entity';
import { UserEntity } from './user.entity';
import { PaymentEntity } from './payment.entity';
import { BillingCycleEntity } from './billing-cycle.entity';
import { PartnerStaffAssignmentEntity } from './partner-staff-assignment.entity';

/**
 * Entidad de persistencia para Commission
 * Almacena las comisiones calculadas para usuarios STAFF basadas en pagos o billing cycles
 * FASE 1: billingCycleId es opcional para mantener compatibilidad con datos existentes
 */
@Entity('commissions')
@Index(['partnerId'])
@Index(['staffUserId'])
@Index(['paymentId'])
@Index(['billingCycleId'])
@Index(['status'])
@Index(['paymentDate'])
@Index(['partnerId', 'paymentDate'])
@Index(['staffUserId', 'status', 'paymentDate'])
export class CommissionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PartnerEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerEntity;

  @Column('int')
  partnerId: number;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'staffUserId' })
  staffUser: UserEntity;

  @Column('int')
  staffUserId: number;

  @ManyToOne(() => PaymentEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'paymentId' })
  payment: PaymentEntity | null;

  @Column('int', { nullable: true })
  paymentId: number | null;

  @ManyToOne(() => BillingCycleEntity, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'billingCycleId' })
  billingCycle: BillingCycleEntity | null;

  @Column('int', { nullable: true })
  billingCycleId: number | null;

  @Column('int')
  subscriptionId: number;

  @ManyToOne(() => PartnerStaffAssignmentEntity, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'assignmentId' })
  assignment: PartnerStaffAssignmentEntity;

  @Column('int')
  assignmentId: number;

  @Column('decimal', { precision: 10, scale: 2 })
  paymentAmount: number;

  @Column('decimal', { precision: 5, scale: 2 })
  commissionPercent: number;

  @Column('decimal', { precision: 10, scale: 2 })
  commissionAmount: number;

  @Column('varchar', { length: 10, default: 'USD' })
  currency: string;

  @Column('datetime')
  paymentDate: Date;

  @Column('varchar', { length: 20, default: 'pending' })
  status: 'pending' | 'paid' | 'cancelled';

  @Column('datetime', { nullable: true })
  paidDate: Date | null;

  @Column('text', { nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
