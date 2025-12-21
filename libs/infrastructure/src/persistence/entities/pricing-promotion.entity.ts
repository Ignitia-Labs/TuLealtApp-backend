import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PricingPlanEntity } from './pricing-plan.entity';
import { BillingPeriod } from '@libs/domain';

/**
 * Entidad de persistencia para PricingPromotion
 * Almacena las promociones por período de facturación de un plan
 */
@Entity('pricing_promotions')
export class PricingPromotionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PricingPlanEntity, (plan) => plan.promotions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pricingPlanId' })
  pricingPlan: PricingPlanEntity;

  @Column('int')
  pricingPlanId: number;

  @Column('varchar', { length: 20 })
  period: BillingPeriod;

  @Column('boolean', { default: true })
  active: boolean;

  @Column('decimal', { precision: 5, scale: 2 })
  discountPercent: number;

  @Column('varchar', { length: 255 })
  label: string;

  @Column('datetime', { nullable: true })
  validUntil: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
