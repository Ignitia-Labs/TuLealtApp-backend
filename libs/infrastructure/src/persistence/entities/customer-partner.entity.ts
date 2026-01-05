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
import { UserEntity } from './user.entity';
import { PartnerEntity } from './partner.entity';
import { TenantEntity } from './tenant.entity';
import { BranchEntity } from './branch.entity';

/**
 * Entidad de persistencia para CustomerPartner
 * Mapea la entidad de dominio CustomerPartner a la tabla de base de datos
 */
@Entity('customer_partners')
@Index('IDX_customer_partners_userId', ['userId'])
@Index('IDX_customer_partners_partnerId', ['partnerId'])
@Index('IDX_customer_partners_tenantId', ['tenantId'])
@Index('IDX_customer_partners_status', ['status'])
@Index('IDX_customer_partners_joinedDate', ['joinedDate'])
@Index('IDX_customer_partners_user_partner', ['userId', 'partnerId'])
@Index('IDX_customer_partners_partner_status', ['partnerId', 'status'])
@Index('IDX_customer_partners_user_status', ['userId', 'status'])
export class CustomerPartnerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('int')
  userId: number;

  @ManyToOne(() => PartnerEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerEntity;

  @Column('int')
  partnerId: number;

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

  @Column('varchar', { length: 20, default: 'active' })
  status: 'active' | 'inactive' | 'suspended';

  @Column('datetime')
  joinedDate: Date;

  @Column('datetime', { nullable: true })
  lastActivityDate: Date | null;

  @Column('json', { nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
