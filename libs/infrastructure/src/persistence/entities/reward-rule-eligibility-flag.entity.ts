import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { RewardRuleEligibilityEntity } from './reward-rule-eligibility.entity';

/**
 * Entidad de persistencia para RewardRuleEligibilityFlag
 * Representa los flags requeridos en una condición de elegibilidad
 */
@Entity('reward_rule_eligibility_flags')
@Index('IDX_ELIGIBILITY_FLAGS_ELIGIBILITY_ID', ['eligibilityId'])
export class RewardRuleEligibilityFlagEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => RewardRuleEligibilityEntity, (eligibility) => eligibility.flags, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eligibility_id' })
  eligibility: RewardRuleEligibilityEntity;

  @Column('int', { name: 'eligibility_id' })
  eligibilityId: number;

  @Column('varchar', { length: 100 })
  flag: string;
}
