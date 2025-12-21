import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantEntity } from './tenant.entity';

/**
 * Entidad de persistencia para Branch
 * Mapea la entidad de dominio Branch a la tabla de base de datos
 */
@Entity('branches')
export class BranchEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.branches, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @Column('int')
  tenantId: number;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('text')
  address: string;

  @Column('varchar', { length: 100 })
  city: string;

  @Column('varchar', { length: 100 })
  country: string;

  @Column('varchar', { length: 50, nullable: true })
  phone: string | null;

  @Column('varchar', { length: 255, nullable: true })
  email: string | null;

  @Column('varchar', { length: 20, default: 'active' })
  status: 'active' | 'inactive' | 'closed';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
