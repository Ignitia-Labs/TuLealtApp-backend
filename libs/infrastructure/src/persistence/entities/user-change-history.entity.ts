import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

/**
 * Entidad de persistencia para UserChangeHistory
 * Almacena el historial de cambios realizados en usuarios
 */
@Entity('user_change_history')
@Index(['userId'])
@Index(['changedBy'])
@Index(['action'])
@Index(['createdAt'])
export class UserChangeHistoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('int')
  userId: number;

  @ManyToOne(() => UserEntity, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'changedBy' })
  changedByUser: UserEntity;

  @Column('int')
  changedBy: number;

  @Column('varchar', { length: 50 })
  action:
    | 'created'
    | 'updated'
    | 'locked'
    | 'unlocked'
    | 'deleted'
    | 'profile_assigned'
    | 'profile_removed'
    | 'role_changed'
    | 'status_changed'
    | 'partner_assigned'
    | 'partner_removed';

  @Column('varchar', { length: 100, nullable: true })
  field: string | null;

  @Column('text', { nullable: true })
  oldValue: string | null;

  @Column('text', { nullable: true })
  newValue: string | null;

  @Column('json', { nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}
