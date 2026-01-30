import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { TenantEntity } from './tenant.entity';
import { UserEntity } from './user.entity';
import { CustomerMembershipEntity } from './customer-membership.entity';

/**
 * Entidad de persistencia para PointsTransaction
 * Mapea la entidad de dominio PointsTransaction a la tabla de base de datos
 * Esta tabla es el LEDGER inmutable - solo se insertan registros, nunca se actualizan
 */
@Entity('points_transactions')
@Index('IDX_POINTS_TRANSACTIONS_IDEMPOTENCY_KEY', ['idempotencyKey'], { unique: true })
@Index('IDX_POINTS_TRANSACTIONS_MEMBERSHIP_ID', ['membershipId'])
@Index('IDX_POINTS_TRANSACTIONS_PROGRAM_ID', ['programId'])
@Index('IDX_POINTS_TRANSACTIONS_SOURCE_EVENT_ID', ['sourceEventId'])
@Index('IDX_POINTS_TRANSACTIONS_CORRELATION_ID', ['correlationId'])
@Index('IDX_POINTS_TRANSACTIONS_CREATED_AT', ['createdAt'])
@Index('IDX_POINTS_TRANSACTIONS_TYPE', ['type'])
@Index('IDX_POINTS_TRANSACTIONS_EXPIRES_AT', ['expiresAt'])
@Index('IDX_POINTS_TRANSACTIONS_REVERSAL_OF', ['reversalOfTransactionId'])
export class PointsTransactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TenantEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @Column('int')
  tenantId: number;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customerId' })
  customer: UserEntity;

  @Column('int')
  customerId: number;

  @ManyToOne(() => CustomerMembershipEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'membershipId' })
  membership: CustomerMembershipEntity;

  @Column('int')
  membershipId: number;

  @Column('int', { nullable: true })
  programId: number | null;

  @Column('int', { nullable: true })
  rewardRuleId: number | null;

  @Column('varchar', { length: 20 })
  type: 'EARNING' | 'REDEEM' | 'ADJUSTMENT' | 'REVERSAL' | 'EXPIRATION' | 'HOLD' | 'RELEASE';

  @Column('int')
  pointsDelta: number; // Positivo para EARNING, negativo para REDEEM/EXPIRATION

  @Column('varchar', { length: 255, unique: true })
  idempotencyKey: string; // Clave única para garantizar idempotencia

  @Column('varchar', { length: 255, nullable: true })
  sourceEventId: string | null; // ID del evento que originó esta transacción

  @Column('varchar', { length: 255, nullable: true })
  correlationId: string | null; // ID para correlacionar transacciones relacionadas

  @Column('varchar', { length: 255, nullable: true })
  createdBy: string | null; // Usuario/sistema que creó la transacción

  @Column('varchar', { length: 100, nullable: true })
  reasonCode: string | null; // Código de razón para auditoría

  @Column('json', { nullable: true })
  metadata: Record<string, any> | null; // Metadatos adicionales (JSON)

  @Column('int', { nullable: true })
  reversalOfTransactionId: number | null; // ID de la transacción que se revierte (solo para REVERSAL)

  @Column('datetime', { nullable: true })
  expiresAt: Date | null; // Fecha de expiración de los puntos (solo para EARNING)

  @CreateDateColumn()
  createdAt: Date;
}
