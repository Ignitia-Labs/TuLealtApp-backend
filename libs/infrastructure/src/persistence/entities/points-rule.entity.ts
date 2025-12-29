import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantEntity } from './tenant.entity';

/**
 * Entidad de persistencia para PointsRule
 * Almacena las reglas para ganar puntos
 */
@Entity('points_rules')
export class PointsRuleEntity {
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

  @Column('varchar', { length: 50 })
  type: 'purchase' | 'birthday' | 'referral' | 'visit' | 'custom';

  @Column('decimal', { precision: 10, scale: 2 })
  pointsPerUnit: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  multiplier: number | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  minAmount: number | null;

  @Column('json', { nullable: true })
  applicableDays: number[] | null; // 0 = Domingo, 1 = Lunes, etc.

  @Column('json', { nullable: true })
  applicableHours: { start: string; end: string } | null; // { start: "09:00", end: "18:00" }

  @Column('datetime', { nullable: true })
  validFrom: Date | null;

  @Column('datetime', { nullable: true })
  validUntil: Date | null;

  @Column('varchar', { length: 20, default: 'active' })
  status: 'active' | 'inactive';

  @Column('int', { default: 1 })
  priority: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

