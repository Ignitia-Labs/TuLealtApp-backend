import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { RewardRuleEligibilityEntity } from './reward-rule-eligibility.entity';

/**
 * Entidad de persistencia para RewardRuleEligibilityCategoryId
 * Representa los IDs de categoría requeridos en una condición de elegibilidad
 */
@Entity('reward_rule_eligibility_category_ids')
@Index('IDX_ELIGIBILITY_CATEGORY_IDS_ELIGIBILITY_ID', ['eligibilityId'])
@Index('IDX_ELIGIBILITY_CATEGORY_IDS_CATEGORY_ID', ['categoryId'])
export class RewardRuleEligibilityCategoryIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => RewardRuleEligibilityEntity, (eligibility) => eligibility.categoryIds, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eligibility_id' })
  eligibility: RewardRuleEligibilityEntity;

  @Column('int', { name: 'eligibility_id' })
  eligibilityId: number;

  @Column('int', { name: 'category_id' })
  categoryId: number;
}
