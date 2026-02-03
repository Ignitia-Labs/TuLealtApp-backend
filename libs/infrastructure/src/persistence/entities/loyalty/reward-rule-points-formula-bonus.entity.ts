import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { RewardRulePointsFormulaEntity } from '@libs/infrastructure/entities/loyalty/reward-rule-points-formula.entity';
import { RewardRuleEligibilityEntity } from '@libs/infrastructure/entities/loyalty/reward-rule-eligibility.entity';

/**
 * Entidad de persistencia para RewardRulePointsFormulaBonus
 * Representa un bono en una fórmula híbrida
 */
@Entity('reward_rule_points_formula_bonuses')
@Index('IDX_REWARD_RULE_POINTS_FORMULA_BONUSES_FORMULA_ID', ['formulaId'])
export class RewardRulePointsFormulaBonusEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => RewardRulePointsFormulaEntity, (formula) => formula.bonuses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'formula_id' })
  formula: RewardRulePointsFormulaEntity;

  @Column('int', { name: 'formula_id' })
  formulaId: number;

  @ManyToOne(() => RewardRulePointsFormulaEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bonus_formula_id' })
  bonusFormula: RewardRulePointsFormulaEntity;

  @Column('int', { name: 'bonus_formula_id' })
  bonusFormulaId: number;

  @ManyToOne(() => RewardRuleEligibilityEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'eligibility_id' })
  eligibility: RewardRuleEligibilityEntity | null;

  @Column('int', { name: 'eligibility_id', nullable: true })
  eligibilityId: number | null;
}
