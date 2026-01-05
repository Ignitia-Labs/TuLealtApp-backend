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
 * Entidad de persistencia para Notification
 * Almacena las notificaciones de usuarios
 */
@Entity('notifications')
@Index(['userId', 'read'])
@Index(['userId', 'createdAt'])
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('int')
  userId: number;

  @Column('varchar', { length: 50 })
  type:
    | 'points_earned'
    | 'points_redeemed'
    | 'reward_available'
    | 'reward_expiring'
    | 'tier_upgrade'
    | 'tier_downgrade'
    | 'promotion'
    | 'system'
    | 'transaction'
    | 'custom';

  @Column('varchar', { length: 255 })
  title: string;

  @Column('text')
  message: string;

  @Column('json', { nullable: true })
  data: Record<string, any> | null;

  @Column('boolean', { default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
