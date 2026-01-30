import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { UserEntity } from './user.entity';

/**
 * Entidad de persistencia para UserRole
 * Representa un rol asignado a un usuario
 */
@Entity('user_roles')
@Index('IDX_USER_ROLES_USER_ID', ['userId'])
@Index('IDX_USER_ROLES_ROLE', ['role'])
@Index('UK_USER_ROLES_USER_ROLE', ['userId', 'role'], { unique: true })
export class UserRoleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, (user) => user.rolesRelation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column('int', { name: 'user_id' })
  userId: number;

  @Column('varchar', { length: 50 })
  role: string; // ej: 'ADMIN', 'PARTNER', 'CUSTOMER', 'PARTNER_STAFF', etc.
}
