import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { RewardRuleEntity } from './reward-rule.entity';
import { RewardRulePointsTableEntryEntity } from './reward-rule-points-table-entry.entity';
import { RewardRulePointsFormulaBonusEntity } from './reward-rule-points-formula-bonus.entity';

/**
 * Entidad de persistencia para RewardRulePointsFormula
 * Representa la fórmula de cálculo de puntos de una regla de recompensa
 */
@Entity('reward_rule_points_formulas')
@Index('IDX_REWARD_RULE_POINTS_FORMULAS_REWARD_RULE_ID', ['rewardRuleId'])
@Index('IDX_REWARD_RULE_POINTS_FORMULAS_FORMULA_TYPE', ['formulaType'])
export class RewardRulePointsFormulaEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => RewardRuleEntity, (rule) => rule.pointsFormulaRelation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reward_rule_id', referencedColumnName: 'id' })
  rewardRule: RewardRuleEntity;

  @Column('int', { name: 'reward_rule_id' })
  rewardRuleId: number;

  @Column('enum', { name: 'formula_type', enum: ['fixed', 'rate', 'table', 'hybrid'] })
  formulaType: 'fixed' | 'rate' | 'table' | 'hybrid';

  // Campos para tipo 'fixed'
  @Column('int', { name: 'fixed_points', nullable: true })
  fixedPoints: number | null;

  // Campos para tipo 'rate'
  @Column('decimal', { name: 'rate_rate', precision: 10, scale: 4, nullable: true })
  rateRate: number | null;

  @Column('enum', { name: 'rate_amount_field', enum: ['netAmount', 'grossAmount'], nullable: true })
  rateAmountField: 'netAmount' | 'grossAmount' | null;

  @Column('enum', {
    name: 'rate_rounding_policy',
    enum: ['floor', 'ceil', 'nearest'],
    nullable: true,
  })
  rateRoundingPolicy: 'floor' | 'ceil' | 'nearest' | null;

  @Column('int', { name: 'rate_min_points', nullable: true })
  rateMinPoints: number | null;

  @Column('int', { name: 'rate_max_points', nullable: true })
  rateMaxPoints: number | null;

  // Campos para tipo 'table' y 'hybrid'
  @Column('json', { name: 'table_data', nullable: true })
  tableData: any | null; // Solo para arrays complejos de tabla

  @ManyToOne(() => RewardRulePointsFormulaEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'hybrid_base_formula_id' })
  hybridBaseFormula: RewardRulePointsFormulaEntity | null;

  @Column('int', { name: 'hybrid_base_formula_id', nullable: true })
  hybridBaseFormulaId: number | null;

  // Relaciones con tablas relacionadas
  @OneToMany(() => RewardRulePointsTableEntryEntity, (entry) => entry.formula, { cascade: true })
  tableEntries: RewardRulePointsTableEntryEntity[];

  @OneToMany(() => RewardRulePointsFormulaBonusEntity, (bonus) => bonus.formula, { cascade: true })
  bonuses: RewardRulePointsFormulaBonusEntity[];
}
