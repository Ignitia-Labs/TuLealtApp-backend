import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { ProfileEntity } from './profile.entity';

/**
 * Entidad de persistencia para UserProfile
 * Mapea la entidad de dominio UserProfile a la tabla de base de datos
 * Representa la asignación de un perfil a un usuario
 */
@Entity('user_profiles')
@Index('idx_user_profiles_user', ['userId'])
@Index('idx_user_profiles_profile', ['profileId'])
@Index('idx_user_profiles_active', ['isActive'])
@Unique('unique_user_profile_active', ['userId', 'profileId', 'isActive'])
export class UserProfileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('int')
  userId: number;

  @ManyToOne(() => ProfileEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profileId' })
  profile: ProfileEntity;

  @Column('int')
  profileId: number;

  @ManyToOne(() => UserEntity, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'assignedBy' })
  assignedByUser: UserEntity;

  @Column('int')
  assignedBy: number; // userId que asignó el perfil

  @Column('datetime', { default: () => 'CURRENT_TIMESTAMP' })
  assignedAt: Date;

  @Column('boolean', { default: true })
  isActive: boolean;
}
