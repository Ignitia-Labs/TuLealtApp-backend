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
import { TenantEntity } from './tenant.entity';

/**
 * Entidad de persistencia para Reward
 * Mapea la entidad de dominio Reward a la tabla de base de datos
 */
@Entity('rewards')
@Index('IDX_rewards_tenantId', ['tenantId'])
@Index('IDX_rewards_status', ['status'])
@Index('IDX_rewards_category', ['category'])
export class RewardEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @Column('int')
  tenantId: number;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('text', { nullable: true })
  description: string | null;

  @Column('text', { nullable: true })
  image: string | null;

  @Column('int')
  pointsRequired: number;

  @Column('int')
  stock: number;

  @Column('int', { nullable: true })
  maxRedemptionsPerUser: number | null;

  @Column('varchar', { length: 20, default: 'active' })
  status: 'active' | 'inactive' | 'draft' | 'expired';

  @Column('varchar', { length: 100 })
  category: string;

  @Column('text', { nullable: true })
  terms: string | null;

  @Column('datetime', { nullable: true })
  validUntil: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
