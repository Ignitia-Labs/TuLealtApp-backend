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
 * Entidad de persistencia para CustomerTier
 * Almacena los niveles/tiers de clientes
 */
@Entity('customer_tiers')
export class CustomerTierEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TenantEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @Column('int')
  tenantId: number;

  @Column('varchar', { length: 100 })
  name: string;

  @Column('text')
  description: string;

  @Column('int')
  minPoints: number;

  @Column('int', { nullable: true })
  maxPoints: number | null; // null para el tier más alto

  @Column('varchar', { length: 7 })
  color: string;

  @Column('json')
  benefits: string[];

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  multiplier: number | null; // Multiplicador de puntos (ej: 1.05 = 5% bonus)

  @Column('varchar', { length: 255, nullable: true })
  icon: string | null; // Nombre del icono o URL

  @Column('int')
  priority: number; // Orden del tier (1 = más bajo, mayor número = más alto)

  @Column('varchar', { length: 20, default: 'active' })
  status: 'active' | 'inactive';

  // Relations
  @OneToMany(() => RewardTierEntity, (rewardTier) => rewardTier.tier, {
    cascade: true,
    eager: false,
  })
  rewardTiers: RewardTierEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
