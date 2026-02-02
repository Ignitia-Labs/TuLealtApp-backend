import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { TierBenefitEntity } from './tier-benefit.entity';
import { TierBenefitCategoryExclusiveRewardEntity } from './tier-benefit-category-exclusive-reward.entity';

/**
 * Entidad de persistencia para TierBenefitCategoryBenefit
 * Representa beneficios específicos por categoría para un tier benefit
 */
@Entity('tier_benefit_category_benefits')
@Index('IDX_TIER_BENEFIT_CATEGORY_BENEFITS_TIER_BENEFIT_ID', ['tierBenefitId'])
@Index('IDX_TIER_BENEFIT_CATEGORY_BENEFITS_CATEGORY_ID', ['categoryId'])
@Index('UK_TIER_BENEFIT_CATEGORY_BENEFITS_TIER_BENEFIT_CATEGORY', ['tierBenefitId', 'categoryId'], { unique: true })
export class TierBenefitCategoryBenefitEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TierBenefitEntity, (tierBenefit) => tierBenefit.categoryBenefitsRelation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tier_benefit_id' })
  tierBenefit: TierBenefitEntity;

  @Column('int', { name: 'tier_benefit_id' })
  tierBenefitId: number;

  @Column('int', { name: 'category_id' })
  categoryId: number;

  @Column('decimal', { name: 'points_multiplier', precision: 5, scale: 2, nullable: true })
  pointsMultiplier: number | null;

  @OneToMany(
    () => TierBenefitCategoryExclusiveRewardEntity,
    (exclusiveReward) => exclusiveReward.categoryBenefit,
    { cascade: true },
  )
  exclusiveRewardsRelation: TierBenefitCategoryExclusiveRewardEntity[];
}
