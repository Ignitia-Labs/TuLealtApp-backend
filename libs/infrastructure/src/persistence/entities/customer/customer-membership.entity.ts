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
import { UserEntity } from '@libs/infrastructure/entities/auth/user.entity';
import { TenantEntity } from '@libs/infrastructure/entities/system/tenant.entity';
import { BranchEntity } from '@libs/infrastructure/entities/partner/branch.entity';
import { CustomerTierEntity } from '@libs/infrastructure/entities/customer/customer-tier.entity';

/**
 * Entidad de persistencia para CustomerMembership
 * Mapea la entidad de dominio CustomerMembership a la tabla de base de datos
 */
@Entity('customer_memberships')
@Index('IDX_CUSTOMER_MEMBERSHIPS_USER_ID', ['userId'])
@Index('IDX_CUSTOMER_MEMBERSHIPS_TENANT_ID', ['tenantId'])
@Index('IDX_CUSTOMER_MEMBERSHIPS_QR_CODE', ['qrCode'])
@Index('IDX_CUSTOMER_MEMBERSHIPS_USER_TENANT_UNIQUE', ['userId', 'tenantId'], { unique: true })
export class CustomerMembershipEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('int')
  userId: number;

  @ManyToOne(() => TenantEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @Column('int')
  tenantId: number;

  @ManyToOne(() => BranchEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'registrationBranchId' })
  registrationBranch: BranchEntity | null;

  @Column('int', { nullable: true })
  registrationBranchId: number | null;

  @Column('int', { default: 0 })
  points: number;

  @ManyToOne(() => CustomerTierEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'tierId' })
  tier: CustomerTierEntity | null;

  @Column('int', { nullable: true })
  tierId: number | null;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  @Column('int', { default: 0 })
  totalVisits: number;

  @Column('datetime', { nullable: true })
  lastVisit: Date | null;

  @Column('datetime')
  joinedDate: Date;

  @Column('varchar', { length: 100, unique: true, nullable: true })
  qrCode: string | null;

  @Column('varchar', { length: 20, default: 'active' })
  status: 'active' | 'inactive';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
