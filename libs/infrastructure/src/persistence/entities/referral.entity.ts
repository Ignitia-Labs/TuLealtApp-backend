import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { CustomerMembershipEntity } from './customer-membership.entity';

/**
 * Entidad de persistencia para Referral
 * Mapea la entidad de dominio Referral a la tabla de base de datos
 */
@Entity('referrals')
@Index('IDX_REFERRALS_REFERRER', ['referrerMembershipId'])
@Index('IDX_REFERRALS_REFERRED', ['referredMembershipId'])
@Index('IDX_REFERRALS_TENANT', ['tenantId'])
@Index('IDX_REFERRALS_STATUS', ['status'])
@Index('IDX_REFERRALS_CREATED_AT', ['createdAt'])
@Unique('UQ_REFERRALS_REFERRER_REFERRED_TENANT', [
  'referrerMembershipId',
  'referredMembershipId',
  'tenantId',
])
export class ReferralEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CustomerMembershipEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'referrerMembershipId' })
  referrerMembership: CustomerMembershipEntity;

  @Column('int')
  referrerMembershipId: number;

  @ManyToOne(() => CustomerMembershipEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'referredMembershipId' })
  referredMembership: CustomerMembershipEntity;

  @Column('int')
  referredMembershipId: number;

  @Column('int')
  tenantId: number;

  @Column('varchar', { length: 20, default: 'pending' })
  status: 'pending' | 'active' | 'completed' | 'cancelled';

  @Column('varchar', { length: 255, nullable: true })
  referralCode: string | null;

  @Column('boolean', { default: false })
  firstPurchaseCompleted: boolean;

  @Column('boolean', { default: false })
  rewardGranted: boolean;

  @Column('datetime', { nullable: true })
  rewardGrantedAt: Date | null;

  @Column('datetime', { nullable: true })
  firstPurchaseCompletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
