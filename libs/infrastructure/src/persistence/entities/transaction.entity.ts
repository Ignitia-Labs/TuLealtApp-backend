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
import { UserEntity } from './user.entity';
import { CustomerMembershipEntity } from './customer-membership.entity';

/**
 * Entidad de persistencia para Transaction
 * Almacena las transacciones de puntos
 */
@Entity('transactions')
@Index('IDX_TRANSACTIONS_USER_ID', ['userId'])
@Index('IDX_TRANSACTIONS_MEMBERSHIP_ID', ['membershipId'])
export class TransactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('int')
  userId: number;

  @ManyToOne(() => CustomerMembershipEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'membershipId' })
  membership: CustomerMembershipEntity | null;

  @Column('int', { nullable: true })
  membershipId: number | null;

  @Column('varchar', { length: 20 })
  type: 'earn' | 'redeem' | 'expire' | 'adjust';

  @Column('int')
  points: number; // Positivo para ganar, negativo para canjear/expirar

  @Column('text')
  description: string;

  @Column('json', { nullable: true })
  metadata: Record<string, any> | null;

  @Column('varchar', { length: 20, default: 'completed' })
  status: 'completed' | 'pending' | 'failed' | 'cancelled';

  // Nuevos campos para transacciones de compra
  @Column('int', { nullable: true })
  cashierId: number | null;

  @Column('datetime', { nullable: true })
  transactionDate: Date | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  transactionAmountTotal: number | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  netAmount: number | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  taxAmount: number | null;

  @Column('int', { nullable: true })
  itemsCount: number | null;

  @Column('varchar', { length: 255, nullable: true })
  transactionReference: string | null;

  @Column('int', { nullable: true })
  pointsEarned: number | null;

  @Column('int', { nullable: true })
  pointsRuleId: number | null;

  // Campos calculados automáticamente
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  pointsMultiplier: number | null;

  @Column('int', { nullable: true })
  basePoints: number | null;

  @Column('int', { nullable: true })
  bonusPoints: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
