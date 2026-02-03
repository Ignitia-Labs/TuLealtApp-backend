import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LoyaltyProgramEntity } from '@libs/infrastructure/entities/loyalty/loyalty-program.entity';
import { CustomerTierEntity } from '@libs/infrastructure/entities/customer/customer-tier.entity';
import { TierBenefitExclusiveRewardEntity } from '@libs/infrastructure/entities/tier/tier-benefit-exclusive-reward.entity';
import { TierBenefitCategoryBenefitEntity } from '@libs/infrastructure/entities/tier/tier-benefit-category-benefit.entity';

/**
 * Entidad de persistencia para TierBenefit
 */
@Entity('tier_benefits')
export class TierBenefitEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => LoyaltyProgramEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'programId' })
  program: LoyaltyProgramEntity;

  @Column('int')
  programId: number;

  @ManyToOne(() => CustomerTierEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tierId' })
  tier: CustomerTierEntity;

  @Column('int')
  tierId: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  pointsMultiplier: number | null;

  @Column('int', { nullable: true })
  cooldownReduction: number | null;

  // ============================================================================
  // Columnas para higherCaps
  // ============================================================================

  @Column('int', { name: 'higher_caps_max_points_per_event', nullable: true })
  higherCapsMaxPointsPerEvent: number | null;

  @Column('int', { name: 'higher_caps_max_points_per_day', nullable: true })
  higherCapsMaxPointsPerDay: number | null;

  @Column('int', { name: 'higher_caps_max_points_per_month', nullable: true })
  higherCapsMaxPointsPerMonth: number | null;

  // ============================================================================
  // Relaciones con Tablas Relacionadas
  // ============================================================================

  @OneToMany(() => TierBenefitExclusiveRewardEntity, (reward) => reward.tierBenefit, {
    cascade: true,
  })
  exclusiveRewardsRelation: TierBenefitExclusiveRewardEntity[];

  @OneToMany(
    () => TierBenefitCategoryBenefitEntity,
    (categoryBenefit) => categoryBenefit.tierBenefit,
    {
      cascade: true,
    },
  )
  categoryBenefitsRelation: TierBenefitCategoryBenefitEntity[];

  @Column('varchar', { length: 20, default: 'active' })
  status: 'active' | 'inactive';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
