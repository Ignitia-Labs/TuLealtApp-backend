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
import { TenantEntity } from './tenant.entity';
import { RewardTierEntity } from './reward-tier.entity';

/**
 * Entidad de persistencia para Reward
 * Almacena las recompensas que los clientes pueden canjear
 */
@Entity('rewards')
export class RewardEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TenantEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @Column('int')
  tenantId: number;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('text')
  description: string;

  @Column('text', { nullable: true })
  image: string | null;

  @Column('int')
  pointsRequired: number;

  @Column('int')
  stock: number; // -1 para ilimitado

  @Column('int', { nullable: true })
  maxRedemptionsPerUser: number | null;

  @Column('varchar', { length: 20, default: 'active' })
  status: 'active' | 'inactive' | 'out_of_stock';

  @Column('varchar', { length: 100 })
  category: string;

  @Column('text', { nullable: true })
  terms: string | null;

  @Column('datetime', { nullable: true })
  validUntil: Date | null;

  // Relations
  @OneToMany(() => RewardTierEntity, (rewardTier) => rewardTier.reward, {
    cascade: true,
    eager: false,
  })
  rewardTiers: RewardTierEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
