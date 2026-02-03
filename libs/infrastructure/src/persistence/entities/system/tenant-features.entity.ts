import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantEntity } from '@libs/infrastructure/entities/system/tenant.entity';

/**
 * Entidad de persistencia para TenantFeatures
 * Almacena las características habilitadas de un tenant
 */
@Entity('tenant_features')
export class TenantFeaturesEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.features, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @Column('int')
  tenantId: number;

  @Column('boolean', { default: true })
  qrScanning: boolean;

  @Column('boolean', { default: true })
  offlineMode: boolean;

  @Column('boolean', { default: true })
  referralProgram: boolean;

  @Column('boolean', { default: true })
  birthdayRewards: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
