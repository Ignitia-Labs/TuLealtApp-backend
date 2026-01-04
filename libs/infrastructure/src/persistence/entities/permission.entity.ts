import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Entidad de persistencia para Permission
 * Mapea la entidad de dominio Permission a la tabla de base de datos
 */
@Entity('permissions')
@Index('idx_permissions_module', ['module'])
@Index('idx_permissions_resource', ['resource'])
@Index('idx_permissions_active', ['isActive'])
@Index('idx_permissions_code', ['code'])
export class PermissionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255, unique: true })
  code: string; // "admin.users.create"

  @Column('varchar', { length: 100 })
  module: string; // "admin"

  @Column('varchar', { length: 100 })
  resource: string; // "users"

  @Column('varchar', { length: 100 })
  action: string; // "create" o "*"

  @Column('text', { nullable: true })
  description: string | null;

  @Column('boolean', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

