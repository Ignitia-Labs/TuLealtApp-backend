import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PricingPlanEntity } from './pricing-plan.entity';

/**
 * Entidad de persistencia para PricingPlanLimits
 * Almacena los límites de un plan de precios
 */
@Entity('pricing_plan_limits')
export class PricingPlanLimitsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => PricingPlanEntity, (plan) => plan.limits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pricingPlanId' })
  pricingPlan: PricingPlanEntity;

  @Column('int', { unique: true })
  pricingPlanId: number;

  @Column('int')
  maxTenants: number; // -1 para ilimitado

  @Column('int')
  maxBranches: number; // -1 para ilimitado

  @Column('int')
  maxCustomers: number; // -1 para ilimitado

  @Column('int')
  maxRewards: number; // -1 para ilimitado

  @Column('int')
  maxAdmins: number; // -1 para ilimitado

  @Column('int')
  storageGB: number; // -1 para ilimitado

  @Column('int')
  apiCallsPerMonth: number; // -1 para ilimitado

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

