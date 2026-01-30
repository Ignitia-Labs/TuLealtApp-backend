import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { RewardRuleEntity } from './reward-rule.entity';
import { RewardRuleEligibilityMembershipStatusEntity } from './reward-rule-eligibility-membership-status.entity';
import { RewardRuleEligibilityFlagEntity } from './reward-rule-eligibility-flag.entity';
import { RewardRuleEligibilityCategoryIdEntity } from './reward-rule-eligibility-category-id.entity';
import { RewardRuleEligibilitySkuEntity } from './reward-rule-eligibility-sku.entity';

/**
 * Entidad de persistencia para RewardRuleEligibility
 * Representa las condiciones de elegibilidad de una regla de recompensa
 */
@Entity('reward_rule_eligibility')
@Index('IDX_REWARD_RULE_ELIGIBILITY_REWARD_RULE_ID', ['rewardRuleId'])
export class RewardRuleEligibilityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => RewardRuleEntity, (rule) => rule.eligibilityRelation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reward_rule_id', referencedColumnName: 'id' })
  rewardRule: RewardRuleEntity;

  @Column('int', { name: 'reward_rule_id' })
  rewardRuleId: number;

  @Column('int', { name: 'min_tier_id', nullable: true })
  minTierId: number | null;

  @Column('int', { name: 'max_tier_id', nullable: true })
  maxTierId: number | null;

  @Column('int', { name: 'min_membership_age_days', nullable: true })
  minMembershipAgeDays: number | null;

  @Column('decimal', { name: 'min_amount', precision: 10, scale: 2, nullable: true })
  minAmount: number | null;

  @Column('decimal', { name: 'max_amount', precision: 10, scale: 2, nullable: true })
  maxAmount: number | null;

  @Column('int', { name: 'min_items', nullable: true })
  minItems: number | null;

  @Column('json', { name: 'day_of_week', nullable: true })
  dayOfWeek: number[] | null; // Array de números [0-6]

  @Column('time', { name: 'time_range_start', nullable: true })
  timeRangeStart: Date | null;

  @Column('time', { name: 'time_range_end', nullable: true })
  timeRangeEnd: Date | null;

  @Column('text', { nullable: true })
  metadata: string | null; // JSON solo para metadata flexible

  // Relaciones con tablas de arrays
  @OneToMany(
    () => RewardRuleEligibilityMembershipStatusEntity,
    (status) => status.eligibility,
    { cascade: true },
  )
  membershipStatuses: RewardRuleEligibilityMembershipStatusEntity[];

  @OneToMany(() => RewardRuleEligibilityFlagEntity, (flag) => flag.eligibility, {
    cascade: true,
  })
  flags: RewardRuleEligibilityFlagEntity[];

  @OneToMany(
    () => RewardRuleEligibilityCategoryIdEntity,
    (categoryId) => categoryId.eligibility,
    { cascade: true },
  )
  categoryIds: RewardRuleEligibilityCategoryIdEntity[];

  @OneToMany(() => RewardRuleEligibilitySkuEntity, (sku) => sku.eligibility, {
    cascade: true,
  })
  skus: RewardRuleEligibilitySkuEntity[];
}
