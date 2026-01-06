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
import { PartnerEntity } from './partner.entity';

/**
 * Entidad de persistencia para Profile
 * Mapea la entidad de dominio Profile a la tabla de base de datos
 */
@Entity('profiles')
@Index('idx_profiles_partner', ['partnerId'])
@Index('idx_profiles_active', ['isActive'])
export class ProfileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('text', { nullable: true })
  description: string | null;

  @ManyToOne(() => PartnerEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerEntity | null;

  @Column('int', { nullable: true })
  partnerId: number | null;

  // permissions property removed - column was deleted from database
  // Permissions are now managed through profile_permissions table
  // This property is kept for TypeScript compatibility but is not persisted
  permissions?: string[]; // DEPRECATED: Not persisted. Use profile_permissions table instead.

  @Column('boolean', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
