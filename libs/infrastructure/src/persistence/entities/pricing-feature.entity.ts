import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PricingPlanEntity } from './pricing-plan.entity';

/**
 * Entidad de persistencia para PricingFeature
 * Almacena las características de un plan
 */
@Entity('pricing_features')
@Index('IDX_PRICING_FEATURES_PLAN_ID', ['pricingPlanId'])
export class PricingFeatureEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PricingPlanEntity, (plan) => plan.features, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pricingPlanId' })
  pricingPlan: PricingPlanEntity;

  @Column('int')
  pricingPlanId: number;

  @Column('varchar', { length: 100 })
  featureId: string;

  @Column('text')
  text: string;

  @Column('boolean', { default: true })
  enabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
