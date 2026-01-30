import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { CustomerMembershipEntity } from './customer-membership.entity';
import { LoyaltyProgramEntity } from './loyalty-program.entity';

/**
 * Entidad de persistencia para Enrollment
 * Mapea la entidad de dominio Enrollment a la tabla de base de datos
 */
@Entity('enrollments')
@Index('IDX_ENROLLMENTS_MEMBERSHIP_ID', ['membershipId'])
@Index('IDX_ENROLLMENTS_PROGRAM_ID', ['programId'])
@Index('IDX_ENROLLMENTS_STATUS', ['status'])
@Index('IDX_ENROLLMENTS_EFFECTIVE_FROM', ['effectiveFrom'])
@Index('IDX_ENROLLMENTS_EFFECTIVE_TO', ['effectiveTo'])
@Unique('UQ_ENROLLMENTS_MEMBERSHIP_PROGRAM', ['membershipId', 'programId'])
export class EnrollmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CustomerMembershipEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'membershipId' })
  membership: CustomerMembershipEntity;

  @Column('int')
  membershipId: number;

  @ManyToOne(() => LoyaltyProgramEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'programId' })
  program: LoyaltyProgramEntity;

  @Column('int')
  programId: number;

  @Column('varchar', { length: 20, default: 'ACTIVE' })
  status: 'ACTIVE' | 'PAUSED' | 'ENDED';

  @Column('datetime')
  effectiveFrom: Date;

  @Column('datetime', { nullable: true })
  effectiveTo: Date | null;

  @Column('json', { nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
