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
import { TenantEntity } from '@libs/infrastructure/entities/system/tenant.entity';
import { PointsTransactionEntity } from '@libs/infrastructure/entities/loyalty/points-transaction.entity';
import { RewardEntity } from '@libs/infrastructure/entities/loyalty/reward.entity';
import { CustomerMembershipEntity } from '@libs/infrastructure/entities/customer/customer-membership.entity';
import { UserEntity } from '@libs/infrastructure/entities/auth/user.entity';

/**
 * Entidad de persistencia para RedemptionCode
 * Mapea la entidad de dominio RedemptionCode a la tabla de base de datos
 */
@Entity('redemption_codes')
@Index('IDX_redemption_codes_code', ['code'], { unique: true })
@Index('IDX_redemption_codes_transaction_id', ['transactionId'])
@Index('IDX_redemption_codes_membership_id', ['membershipId'])
@Index('IDX_redemption_codes_status', ['status'])
@Index('IDX_redemption_codes_tenant_id', ['tenantId'])
export class RedemptionCodeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 50, unique: true })
  code: string;

  @ManyToOne(() => PointsTransactionEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transactionId' })
  transaction: PointsTransactionEntity;

  @Column('int')
  transactionId: number;

  @ManyToOne(() => RewardEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'rewardId' })
  reward: RewardEntity;

  @Column('int')
  rewardId: number;

  @ManyToOne(() => CustomerMembershipEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'membershipId' })
  membership: CustomerMembershipEntity;

  @Column('int')
  membershipId: number;

  @ManyToOne(() => TenantEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @Column('int')
  tenantId: number;

  @Column('varchar', { length: 20, default: 'pending' })
  status: 'pending' | 'used' | 'expired' | 'cancelled';

  @Column('datetime', { nullable: true })
  expiresAt: Date | null;

  @Column('datetime', { nullable: true })
  usedAt: Date | null;

  @ManyToOne(() => UserEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'usedBy' })
  usedByUser: UserEntity | null;

  @Column('int', { nullable: true })
  usedBy: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
