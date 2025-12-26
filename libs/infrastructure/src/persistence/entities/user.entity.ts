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
import { TenantEntity } from './tenant.entity';
import { BranchEntity } from './branch.entity';

/**
 * Entidad de persistencia para User
 * Mapea la entidad de dominio User a la tabla de base de datos
 */
@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255, unique: true })
  email: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 255 })
  firstName: string;

  @Column('varchar', { length: 255 })
  lastName: string;

  @Column('varchar', { length: 50 })
  phone: string;

  @Column('json', { nullable: true })
  profile: Record<string, any> | null;

  @Column('varchar', { length: 255 })
  passwordHash: string;

  @Column('json')
  roles: string[];

  @Column('boolean', { default: true })
  isActive: boolean; // Mantener para compatibilidad

  @ManyToOne(() => PartnerEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerEntity | null;

  @Column('int', { nullable: true })
  partnerId: number | null;

  @ManyToOne(() => TenantEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity | null;

  @Column('int', { nullable: true })
  tenantId: number | null;

  @ManyToOne(() => BranchEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'branchId' })
  branch: BranchEntity | null;

  @Column('int', { nullable: true })
  branchId: number | null;

  @Column('int', { default: 0 })
  points: number;

  @Column('varchar', { length: 100, unique: true, nullable: true })
  qrCode: string | null;

  @Column('text', { nullable: true })
  avatar: string | null;

  @Column('int', { nullable: true })
  tierId: number | null; // FK a CustomerTier (se creará después)

  @Column('varchar', { length: 20, default: 'active' })
  status: 'active' | 'inactive' | 'suspended';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
