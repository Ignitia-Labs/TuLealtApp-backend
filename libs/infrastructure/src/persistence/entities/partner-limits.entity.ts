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
 * Entidad de persistencia para PartnerLimits
 * Almacena los límites de un partner según su plan
 */
@Entity('partner_limits')
export class PartnerLimitsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PartnerEntity, (partner) => partner.limits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerEntity;

  @Column('int')
  partnerId: number;

  @Column('int')
  maxTenants: number;

  @Column('int')
  maxBranches: number;

  @Column('int')
  maxCustomers: number;

  @Column('int')
  maxRewards: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
