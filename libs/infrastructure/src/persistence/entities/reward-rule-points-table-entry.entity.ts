import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { RewardRulePointsFormulaEntity } from './reward-rule-points-formula.entity';

/**
 * Entidad de persistencia para RewardRulePointsTableEntry
 * Representa una entrada en una tabla de puntos (para tipo 'table')
 */
@Entity('reward_rule_points_table_entries')
@Index('IDX_REWARD_RULE_POINTS_TABLE_ENTRIES_FORMULA_ID', ['formulaId'])
export class RewardRulePointsTableEntryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => RewardRulePointsFormulaEntity, (formula) => formula.tableEntries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'formula_id' })
  formula: RewardRulePointsFormulaEntity;

  @Column('int', { name: 'formula_id' })
  formulaId: number;

  @Column('decimal', { name: 'min_value', precision: 10, scale: 2 })
  minValue: number;

  @Column('decimal', { name: 'max_value', precision: 10, scale: 2, nullable: true })
  maxValue: number | null;

  @Column('int')
  points: number;

  @Column('int', { name: 'sort_order', default: 0 })
  sortOrder: number;
}
