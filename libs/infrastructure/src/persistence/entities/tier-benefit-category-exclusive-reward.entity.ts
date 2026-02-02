import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TierBenefitCategoryBenefitEntity } from './tier-benefit-category-benefit.entity';

/**
 * Entidad de persistencia para TierBenefitCategoryExclusiveReward
 * Representa una recompensa exclusiva para una categoría específica dentro de un tier benefit
 */
@Entity('tier_benefit_category_exclusive_rewards')
@Index('IDX_TIER_BENEFIT_CATEGORY_EXCLUSIVE_REWARDS_CATEGORY_BENEFIT_ID', ['categoryBenefitId'])
@Index('IDX_TIER_BENEFIT_CATEGORY_EXCLUSIVE_REWARDS_REWARD_ID', ['rewardId'])
@Index(
  'UK_TIER_BENEFIT_CATEGORY_EXCLUSIVE_REWARDS_CATEGORY_BENEFIT_REWARD',
  ['categoryBenefitId', 'rewardId'],
  {
    unique: true,
  },
)
export class TierBenefitCategoryExclusiveRewardEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => TierBenefitCategoryBenefitEntity,
    (categoryBenefit) => categoryBenefit.exclusiveRewardsRelation,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'category_benefit_id' })
  categoryBenefit: TierBenefitCategoryBenefitEntity;

  @Column('int', { name: 'category_benefit_id' })
  categoryBenefitId: number;

  @Column('varchar', { name: 'reward_id', length: 255 })
  rewardId: string; // ID de la recompensa exclusiva para esta categoría
}
