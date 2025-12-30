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
import { PartnerEntity } from './partner.entity';
import { UserEntity } from './user.entity';

/**
 * Entidad de persistencia para PartnerStaffAssignment
 * Almacena las asignaciones de usuarios STAFF a partners con porcentajes de comisión
 */
@Entity('partner_staff_assignments')
@Index(['partnerId'])
@Index(['staffUserId'])
@Index(['isActive'])
@Index(['startDate', 'endDate'])
export class PartnerStaffAssignmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PartnerEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerEntity;

  @Column('int')
  partnerId: number;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'staffUserId' })
  staffUser: UserEntity;

  @Column('int')
  staffUserId: number;

  @Column('decimal', { precision: 5, scale: 2 })
  commissionPercent: number; // 0.00 - 100.00

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('datetime')
  startDate: Date;

  @Column('datetime', { nullable: true })
  endDate: Date | null;

  @Column('text', { nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

