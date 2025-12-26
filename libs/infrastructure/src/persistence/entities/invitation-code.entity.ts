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
import { TenantEntity } from './tenant.entity';
import { BranchEntity } from './branch.entity';
import { UserEntity } from './user.entity';

/**
 * Entidad de persistencia para InvitationCode
 * Almacena los códigos de invitación
 */
@Entity('invitation_codes')
@Index(['tenantId'])
@Index(['branchId'])
export class InvitationCodeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 100, unique: true })
  code: string;

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
  @JoinColumn({ name: 'branchId' })
  branch: BranchEntity | null;

  @Column('int', { nullable: true })
  branchId: number | null;

  @Column('varchar', { length: 10 })
  type: 'text' | 'qr';

  @Column('int', { nullable: true })
  maxUses: number | null; // null para ilimitado

  @Column('int', { default: 0 })
  currentUses: number;

  @Column('datetime', { nullable: true })
  expiresAt: Date | null;

  @Column('varchar', { length: 20, default: 'active' })
  status: 'active' | 'expired' | 'disabled';

  @ManyToOne(() => UserEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity | null;

  @Column('int', { nullable: true })
  createdBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

