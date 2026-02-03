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
import { PartnerSubscriptionEntity } from '@libs/infrastructure/entities/partner/partner-subscription.entity';

/**
 * Entidad de persistencia para PartnerSubscriptionUsage
 * Almacena el uso actual de una suscripción de partner
 */
@Entity('partner_subscription_usage')
export class PartnerSubscriptionUsageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => PartnerSubscriptionEntity, (subscription) => subscription.usage, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'partnerSubscriptionId' })
  partnerSubscription: PartnerSubscriptionEntity;

  @Column('int', { unique: true })
  partnerSubscriptionId: number;

  @Column('int', { default: 0 })
  tenantsCount: number;

  @Column('int', { default: 0 })
  branchesCount: number;

  @Column('int', { default: 0 })
  customersCount: number;

  @Column('int', { default: 0 })
  rewardsCount: number;

  @Column('int', { default: 0 })
  loyaltyProgramsCount: number;

  @Column('int', { default: 0 })
  loyaltyProgramsBaseCount: number;

  @Column('int', { default: 0 })
  loyaltyProgramsPromoCount: number;

  @Column('int', { default: 0 })
  loyaltyProgramsPartnerCount: number;

  @Column('int', { default: 0 })
  loyaltyProgramsSubscriptionCount: number;

  @Column('int', { default: 0 })
  loyaltyProgramsExperimentalCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
