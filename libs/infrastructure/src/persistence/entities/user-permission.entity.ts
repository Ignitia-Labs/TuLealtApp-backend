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
import { PermissionEntity } from './permission.entity';

/**
 * Entidad de persistencia para UserPermission
 * Mapea la entidad de dominio UserPermission a la tabla de base de datos
 * Representa la asignación directa de un permiso a un usuario
 */
@Entity('user_permissions')
@Index('idx_user_permissions_user', ['userId'])
@Index('idx_user_permissions_permission', ['permissionId'])
@Index('idx_user_permissions_active', ['isActive'])
@Unique('unique_user_permission_active', ['userId', 'permissionId', 'isActive'])
export class UserPermissionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('int')
  userId: number;

  @ManyToOne(() => PermissionEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permissionId' })
  permission: PermissionEntity;

  @Column('int')
  permissionId: number;

  @ManyToOne(() => UserEntity, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'assignedBy' })
  assignedByUser: UserEntity;

  @Column('int')
  assignedBy: number; // userId que asignó el permiso

  @Column('datetime', { default: () => 'CURRENT_TIMESTAMP' })
  assignedAt: Date;

  @Column('boolean', { default: true })
  isActive: boolean;
}

