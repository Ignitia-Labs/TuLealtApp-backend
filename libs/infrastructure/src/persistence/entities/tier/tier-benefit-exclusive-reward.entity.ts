import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TierBenefitEntity } from '@libs/infrastructure/entities/tier/tier-benefit.entity';

/**
 * Entidad de persistencia para TierBenefitExclusiveReward
 * Representa una recompensa exclusiva asignada a un tier benefit
 */
@Entity('tier_benefit_exclusive_rewards')
@Index('IDX_TIER_BENEFIT_EXCLUSIVE_REWARDS_TIER_BENEFIT_ID', ['tierBenefitId'])
@Index('IDX_TIER_BENEFIT_EXCLUSIVE_REWARDS_REWARD_ID', ['rewardId'])
@Index('UK_TIER_BENEFIT_EXCLUSIVE_REWARDS_TIER_BENEFIT_REWARD', ['tierBenefitId', 'rewardId'], {
  unique: true,
})
export class TierBenefitExclusiveRewardEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TierBenefitEntity, (tierBenefit) => tierBenefit.exclusiveRewardsRelation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tier_benefit_id' })
  tierBenefit: TierBenefitEntity;

  @Column('int', { name: 'tier_benefit_id' })
  tierBenefitId: number;

  @Column('varchar', { name: 'reward_id', length: 255 })
  rewardId: string; // ID de la recompensa exclusiva
}
