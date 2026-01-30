import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { RewardRuleEligibilityEntity } from './reward-rule-eligibility.entity';

/**
 * Entidad de persistencia para RewardRuleEligibilityMembershipStatus
 * Representa los estados de membresía requeridos en una condición de elegibilidad
 */
@Entity('reward_rule_eligibility_membership_status')
@Index('IDX_ELIGIBILITY_MEMBERSHIP_STATUS_ELIGIBILITY_ID', ['eligibilityId'])
export class RewardRuleEligibilityMembershipStatusEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => RewardRuleEligibilityEntity, (eligibility) => eligibility.membershipStatuses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eligibility_id' })
  eligibility: RewardRuleEligibilityEntity;

  @Column('int', { name: 'eligibility_id' })
  eligibilityId: number;

  @Column('enum', { enum: ['active', 'inactive'] })
  status: 'active' | 'inactive';
}
