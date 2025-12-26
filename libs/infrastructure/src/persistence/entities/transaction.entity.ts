import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

/**
 * Entidad de persistencia para Transaction
 * Almacena las transacciones de puntos
 */
@Entity('transactions')
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

