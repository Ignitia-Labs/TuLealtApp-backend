import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { GoalMetric } from '@libs/domain';

/**
 * Entidad de persistencia para Goal
 * Almacena las metas de suscripciones
 */
@Entity('goals')
@Index('idx_metric', ['metric'])
@Index('idx_period', ['periodStart', 'periodEnd'])
@Index('idx_active', ['isActive'])
export class GoalEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('text', { nullable: true })
  description: string | null;

  @Column('varchar', { length: 50 })
  metric: GoalMetric;

  @Column('decimal', { precision: 10, scale: 2 })
  targetValue: number;

  @Column('datetime')
  periodStart: Date;

  @Column('datetime')
  periodEnd: Date;

  @Column('boolean', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
