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
import { PartnerEntity } from './partner.entity';
import { TenantEntity } from './tenant.entity';
import { BranchEntity } from './branch.entity';
import { UserRoleEntity } from './user-role.entity';
import { UserProfileDataEntity } from './user-profile-data.entity';

/**
 * Entidad de persistencia para User
 * Mapea la entidad de dominio User a la tabla de base de datos
 *
 * NOTA: Los campos JSON se mantienen temporalmente para compatibilidad durante la migración.
 * Las nuevas tablas relacionadas son la fuente de verdad después de migrar los datos.
 */
@Entity('users')
@Index('IDX_USERS_EMAIL', ['email'])
@Index('IDX_users_tenantId', ['tenantId'])
@Index('IDX_users_branchId', ['branchId'])
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

  @Column('varchar', { length: 255 })
  passwordHash: string;

  // ============================================================================
  // Relaciones con Tablas Relacionadas (Fuente de Verdad - Columnas JSON eliminadas)
  // ============================================================================

  @OneToMany(() => UserRoleEntity, (userRole) => userRole.user, { cascade: true })
  rolesRelation: UserRoleEntity[];

  @OneToMany(() => UserProfileDataEntity, (profileData) => profileData.user, { cascade: true })
  profileDataRelation: UserProfileDataEntity[];

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

  @Column('text', { nullable: true })
  avatar: string | null;

  @Column('varchar', { length: 20, default: 'active' })
  status: 'active' | 'inactive' | 'suspended';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
