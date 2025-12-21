import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PartnerEntity } from './partner.entity';

/**
 * Entidad de persistencia para PartnerStats
 * Almacena las estadísticas actuales de un partner
 */
@Entity('partner_stats')
export class PartnerStatsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PartnerEntity, (partner) => partner.stats, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerEntity;

  @Column('int')
  partnerId: number;

  @Column('int', { default: 0 })
  tenantsCount: number;

  @Column('int', { default: 0 })
  branchesCount: number;

  @Column('int', { default: 0 })
  customersCount: number;

  @Column('int', { default: 0 })
  rewardsCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
