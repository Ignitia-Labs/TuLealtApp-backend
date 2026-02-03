import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PricingPlanEntity } from '@libs/infrastructure/entities/billing/pricing-plan.entity';

/**
 * Entidad de persistencia para LegacyPromotion
 * Almacena la promoción legacy de un plan (solo una por plan)
 */
@Entity('legacy_promotions')
export class LegacyPromotionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => PricingPlanEntity, (plan) => plan.legacyPromotion, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pricingPlanId' })
  pricingPlan: PricingPlanEntity;

  @Column('int', { unique: true })
  pricingPlanId: number;

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
