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
import { RewardEntity } from './reward.entity';
import { CustomerTierEntity } from './customer-tier.entity';

/**
 * Entidad de persistencia para RewardTier
 * Tabla de relación many-to-many entre Rewards y CustomerTiers
 */
@Entity('reward_tiers')
@Index(['rewardId', 'tierId'], { unique: true })
export class RewardTierEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => RewardEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'rewardId' })
  reward: RewardEntity;

  @Column('int')
  rewardId: number;

  @ManyToOne(() => CustomerTierEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tierId' })
  tier: CustomerTierEntity;

  @Column('int')
  tierId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
