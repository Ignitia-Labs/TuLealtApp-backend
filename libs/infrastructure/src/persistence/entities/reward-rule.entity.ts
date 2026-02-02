import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { LoyaltyProgramEntity } from './loyalty-program.entity';
import { RewardRuleEligibilityEntity } from './reward-rule-eligibility.entity';
import { RewardRulePointsFormulaEntity } from './reward-rule-points-formula.entity';

/**
 * Entidad de persistencia para RewardRule
 * Mapea la entidad de dominio RewardRule a la tabla de base de datos
 */
@Entity('reward_rules')
@Index('IDX_REWARD_RULES_PROGRAM_ID', ['programId'])
@Index('IDX_REWARD_RULES_TRIGGER', ['trigger'])
@Index('IDX_REWARD_RULES_STATUS', ['status'])
@Index('IDX_REWARD_RULES_EARNING_DOMAIN', ['earningDomain'])
@Index('IDX_REWARD_RULES_CONFLICT_GROUP', ['conflictGroup'])
@Index('IDX_REWARD_RULES_PROGRAM_TRIGGER_STATUS', ['programId', 'trigger', 'status'])
@Index('IDX_REWARD_RULES_CONFLICT_PRIORITY_RANK', ['conflictPriorityRank'])
export class RewardRuleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => LoyaltyProgramEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'programId' })
  program: LoyaltyProgramEntity;

  @Column('int')
  programId: number;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('text', { nullable: true })
  description: string | null;

  @Column('varchar', { length: 20 })
  trigger: 'VISIT' | 'PURCHASE' | 'REFERRAL' | 'SUBSCRIPTION' | 'RETENTION' | 'CUSTOM';

  // ============================================================================
  // Nuevas Columnas Relacionales (Fuente de Verdad después de migración)
  // ============================================================================

  // Columnas para scope
  @Column('int', { name: 'scope_tenant_id', nullable: false })
  scopeTenantId: number;

  @Column('int', { name: 'scope_program_id', nullable: false })
  scopeProgramId: number;

  @Column('int', { name: 'scope_store_id', nullable: true })
  scopeStoreId: number | null;

  @Column('int', { name: 'scope_branch_id', nullable: true })
  scopeBranchId: number | null;

  @Column('varchar', { name: 'scope_channel', length: 50, nullable: true })
  scopeChannel: string | null;

  @Column('int', { name: 'scope_category_id', nullable: true })
  scopeCategoryId: number | null;

  @Column('varchar', { name: 'scope_sku', length: 255, nullable: true })
  scopeSku: string | null;

  // Columnas para conflict
  @Column('varchar', {
    name: 'conflict_stack_policy',
    length: 20,
    nullable: false,
    default: 'EXCLUSIVE',
  })
  conflictStackPolicy: 'STACK' | 'EXCLUSIVE' | 'BEST_OF' | 'PRIORITY';

  @Column('int', { name: 'conflict_priority_rank', nullable: false, default: 0 })
  conflictPriorityRank: number;

  @Column('int', { name: 'conflict_max_awards_per_event', nullable: true })
  conflictMaxAwardsPerEvent: number | null;

  // Columnas para idempotencyScope
  @Column('varchar', {
    name: 'idempotency_strategy',
    length: 20,
    nullable: false,
    default: 'default',
  })
  idempotencyStrategy: 'default' | 'per-day' | 'per-period' | 'per-event';

  @Column('varchar', { name: 'idempotency_bucket_timezone', length: 50, nullable: true })
  idempotencyBucketTimezone: string | null;

  @Column('int', { name: 'idempotency_period_days', nullable: true })
  idempotencyPeriodDays: number | null;

  // Columnas para limits
  @Column('varchar', { name: 'limit_frequency', length: 20, nullable: true })
  limitFrequency: 'per-event' | 'daily' | 'weekly' | 'monthly' | 'per-period' | null;

  @Column('int', { name: 'limit_cooldown_hours', nullable: true })
  limitCooldownHours: number | null;

  @Column('int', { name: 'limit_per_event_cap', nullable: true })
  limitPerEventCap: number | null;

  @Column('int', { name: 'limit_per_period_cap', nullable: true })
  limitPerPeriodCap: number | null;

  @Column('varchar', { name: 'limit_period_type', length: 20, nullable: true })
  limitPeriodType: 'rolling' | 'calendar' | null;

  @Column('int', { name: 'limit_period_days', nullable: true })
  limitPeriodDays: number | null;

  // ============================================================================
  // Relaciones con Tablas Relacionadas
  // ============================================================================
  // NOTA: Las relaciones OneToOne están definidas en las entidades relacionadas
  // porque ellas tienen la foreign key (reward_rule_id). Aquí solo definimos
  // la relación inversa sin JoinColumn.

  @OneToOne(() => RewardRuleEligibilityEntity, (eligibility) => eligibility.rewardRule, {
    cascade: true,
  })
  eligibilityRelation: RewardRuleEligibilityEntity | null;

  @OneToOne(() => RewardRulePointsFormulaEntity, (formula) => formula.rewardRule, { cascade: true })
  pointsFormulaRelation: RewardRulePointsFormulaEntity | null;

  @Column('varchar', { length: 50 })
  earningDomain: string; // Debe ser del catálogo

  @Column('varchar', { length: 50 })
  conflictGroup: string; // Duplicado para índices (extraído de conflict.conflictGroup)

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
