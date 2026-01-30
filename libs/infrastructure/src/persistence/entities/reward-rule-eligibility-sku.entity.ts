import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { RewardRuleEligibilityEntity } from './reward-rule-eligibility.entity';

/**
 * Entidad de persistencia para RewardRuleEligibilitySku
 * Representa los SKUs requeridos en una condición de elegibilidad
 */
@Entity('reward_rule_eligibility_skus')
@Index('IDX_ELIGIBILITY_SKUS_ELIGIBILITY_ID', ['eligibilityId'])
@Index('IDX_ELIGIBILITY_SKUS_SKU', ['sku'])
export class RewardRuleEligibilitySkuEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => RewardRuleEligibilityEntity, (eligibility) => eligibility.skus, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eligibility_id' })
  eligibility: RewardRuleEligibilityEntity;

  @Column('int', { name: 'eligibility_id' })
  eligibilityId: number;

  @Column('varchar', { length: 255 })
  sku: string;
}
