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
import { TenantEntity } from './tenant.entity';
import { LoyaltyProgramEarningDomainEntity } from './loyalty-program-earning-domain.entity';

/**
 * Entidad de persistencia para LoyaltyProgram
 * Mapea la entidad de dominio LoyaltyProgram a la tabla de base de datos
 *
 * NOTA: Los campos JSON se mantienen temporalmente para compatibilidad durante la migración.
 * Las nuevas columnas relacionales son la fuente de verdad después de migrar los datos.
 */
@Entity('loyalty_programs')
@Index('IDX_LOYALTY_PROGRAMS_TENANT_ID', ['tenantId'])
@Index('IDX_LOYALTY_PROGRAMS_TYPE', ['programType'])
@Index('IDX_LOYALTY_PROGRAMS_STATUS', ['status'])
@Index('IDX_LOYALTY_PROGRAMS_TENANT_TYPE_STATUS', ['tenantId', 'programType', 'status'])
export class LoyaltyProgramEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TenantEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @Column('int')
  tenantId: number;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('text', { nullable: true })
  description: string | null;

  @Column('varchar', { length: 20 })
  programType: 'BASE' | 'PROMO' | 'PARTNER' | 'SUBSCRIPTION' | 'EXPERIMENTAL';

  @Column('int', { default: 0 })
  priorityRank: number;

  // ============================================================================
  // Columnas Relacionales (Fuente de Verdad - Columnas JSON eliminadas)
  // ============================================================================

  // Columnas para stacking
  @Column('boolean', { name: 'stacking_allowed', nullable: false, default: false })
  stackingAllowed: boolean;

  @Column('int', { name: 'stacking_max_programs_per_event', nullable: true })
  stackingMaxProgramsPerEvent: number | null;

  @Column('int', { name: 'stacking_max_programs_per_period', nullable: true })
  stackingMaxProgramsPerPeriod: number | null;

  @Column('enum', { name: 'stacking_period', enum: ['daily', 'weekly', 'monthly'], nullable: true })
  stackingPeriod: 'daily' | 'weekly' | 'monthly' | null;

  @Column('enum', {
    name: 'stacking_selection_strategy',
    enum: ['BEST_VALUE', 'PRIORITY_RANK', 'FIRST_MATCH'],
    nullable: true,
  })
  stackingSelectionStrategy: 'BEST_VALUE' | 'PRIORITY_RANK' | 'FIRST_MATCH' | null;

  // Columnas para limits
  @Column('int', { name: 'limit_max_points_per_event', nullable: true })
  limitMaxPointsPerEvent: number | null;

  @Column('int', { name: 'limit_max_points_per_day', nullable: true })
  limitMaxPointsPerDay: number | null;

  @Column('int', { name: 'limit_max_points_per_month', nullable: true })
  limitMaxPointsPerMonth: number | null;

  @Column('int', { name: 'limit_max_points_per_year', nullable: true })
  limitMaxPointsPerYear: number | null;

  // Columnas para expirationPolicy
  @Column('boolean', { name: 'expiration_enabled', nullable: false, default: false })
  expirationEnabled: boolean;

  @Column('enum', { name: 'expiration_type', enum: ['simple', 'bucketed'], nullable: true })
  expirationType: 'simple' | 'bucketed' | null;

  @Column('int', { name: 'expiration_days_to_expire', nullable: true })
  expirationDaysToExpire: number | null;

  @Column('int', { name: 'expiration_grace_period_days', nullable: true })
  expirationGracePeriodDays: number | null;

  // ============================================================================
  // Relación con Tabla Relacionada
  // ============================================================================

  @OneToMany(() => LoyaltyProgramEarningDomainEntity, (earningDomain) => earningDomain.program, {
    cascade: true,
  })
  earningDomainsRelation: LoyaltyProgramEarningDomainEntity[];

  @Column('varchar', { length: 10, nullable: true })
  currency: string | null;

  @Column('int', { default: 0 })
  minPointsToRedeem: number;

  @Column('varchar', { length: 20, default: 'draft' })
  status: 'active' | 'inactive' | 'draft';

  @Column('int', { default: 1 })
  version: number;

  @Column('datetime', { nullable: true })
  activeFrom: Date | null;

  @Column('datetime', { nullable: true })
  activeTo: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
