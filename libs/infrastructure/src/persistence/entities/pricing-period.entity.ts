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
import { BillingPeriod } from '@libs/domain';

/**
 * Entidad de persistencia para PricingPeriod
 * Almacena los precios por período de facturación de un plan
 */
@Entity('pricing_periods')
@Index('IDX_PRICING_PERIODS_PLAN_ID', ['pricingPlanId'])
export class PricingPeriodEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PricingPlanEntity, (plan) => plan.pricingPeriods, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pricingPlanId' })
  pricingPlan: PricingPlanEntity;

  @Column('int')
  pricingPlanId: number;

  @Column('varchar', { length: 20 })
  period: BillingPeriod;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  price: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
