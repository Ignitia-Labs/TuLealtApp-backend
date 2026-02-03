import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { ProfileEntity } from '@libs/infrastructure/entities/auth/profile.entity';
import { PermissionEntity } from '@libs/infrastructure/entities/auth/permission.entity';

/**
 * Entidad de persistencia para ProfilePermission
 * Mapea la entidad de dominio ProfilePermission a la tabla de base de datos
 * Representa la relación many-to-many entre perfiles y permisos
 */
@Entity('profile_permissions')
@Index('idx_profile_permissions_profile', ['profileId'])
@Index('idx_profile_permissions_permission', ['permissionId'])
@Unique('unique_profile_permission', ['profileId', 'permissionId'])
export class ProfilePermissionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProfileEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profileId' })
  profile: ProfileEntity;

  @Column('int')
  profileId: number;

  @ManyToOne(() => PermissionEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permissionId' })
  permission: PermissionEntity;

  @Column('int')
  permissionId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
