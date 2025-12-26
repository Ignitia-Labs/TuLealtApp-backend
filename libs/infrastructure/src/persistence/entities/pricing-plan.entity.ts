import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PricingPeriodEntity } from './pricing-period.entity';
import { PricingPromotionEntity } from './pricing-promotion.entity';
import { PricingFeatureEntity } from './pricing-feature.entity';
import { LegacyPromotionEntity } from './legacy-promotion.entity';
import { PricingPlanLimitsEntity } from './pricing-plan-limits.entity';

/**
 * Entidad de persistencia para PricingPlan
 * Mapea la entidad de dominio PricingPlan a la tabla de base de datos
 */
@Entity('pricing_plans')
export class PricingPlanEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 50 })
  icon: string;

  @Column('varchar', { length: 50, unique: true })
  slug: string;

  // Legacy support
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  basePrice: number | null;

  @Column('varchar', { length: 50, default: '' })
  period: string;

  @Column('text')
  description: string;

  @Column('varchar', { length: 255 })
  cta: string;

  @Column('boolean', { default: false })
  highlighted: boolean;

  @Column('varchar', { length: 20, default: 'active' })
  status: 'active' | 'inactive';

  @Column('int', { default: 0 })
  order: number;

  @Column('int', { default: 14 })
  trialDays: number;

  @Column('boolean', { default: false })
  popular: boolean;

  // Relations
  @OneToOne(() => PricingPlanLimitsEntity, (limits) => limits.pricingPlan, {
    cascade: true,
    eager: false,
    nullable: true,
  })
  limits: PricingPlanLimitsEntity | null;

  @OneToMany(() => PricingPeriodEntity, (period) => period.pricingPlan, {
    cascade: true,
    eager: false,
  })
  pricingPeriods: PricingPeriodEntity[];

  @OneToMany(() => PricingPromotionEntity, (promotion) => promotion.pricingPlan, {
    cascade: true,
    eager: false,
  })
  promotions: PricingPromotionEntity[];

  @OneToMany(() => PricingFeatureEntity, (feature) => feature.pricingPlan, {
    cascade: true,
    eager: false,
  })
  features: PricingFeatureEntity[];

  @OneToOne(() => LegacyPromotionEntity, (promotion) => promotion.pricingPlan, {
    cascade: true,
    eager: false,
    nullable: true,
  })
  legacyPromotion: LegacyPromotionEntity | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
