import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PartnerEntity } from '@libs/infrastructure/entities/partner/partner.entity';
import { TenantFeaturesEntity } from '@libs/infrastructure/entities/system/tenant-features.entity';
import { BranchEntity } from '@libs/infrastructure/entities/partner/branch.entity';
import { CurrencyEntity } from '@libs/infrastructure/entities/system/currency.entity';

/**
 * Entidad de persistencia para Tenant
 * Mapea la entidad de dominio Tenant a la tabla de base de datos
 */
@Entity('tenants')
@Index('IDX_TENANTS_PARTNER_ID', ['partnerId'])
@Index('IDX_TENANTS_QUICK_SEARCH_CODE', ['quickSearchCode'])
export class TenantEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PartnerEntity, (partner) => partner.tenants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerEntity;

  @Column('int')
  partnerId: number;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('text', { nullable: true })
  description: string | null;

  @Column('text', { nullable: true })
  logo: string | null;

  @Column('text', { nullable: true })
  banner: string | null;

  @Column('varchar', { length: 100 })
  category: string;

  @ManyToOne(() => CurrencyEntity, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'currencyId' })
  currency: CurrencyEntity;

  @Column('int')
  currencyId: number;

  @Column('varchar', { length: 7 })
  primaryColor: string;

  @Column('varchar', { length: 7 })
  secondaryColor: string;

  @Column('int', { default: 365 })
  pointsExpireDays: number;

  @Column('int', { default: 100 })
  minPointsToRedeem: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  taxPercentage: number;

  @Column('int', { default: 15 })
  redemptionCodeTtlMinutes: number;

  @Column('varchar', { length: 20, unique: true })
  quickSearchCode: string;

  @Column('varchar', { length: 20, default: 'active' })
  status: 'active' | 'inactive' | 'suspended';

  // Relations
  @OneToOne(() => TenantFeaturesEntity, (features) => features.tenant, {
    cascade: false,
    eager: false,
  })
  features: TenantFeaturesEntity | null;

  @OneToMany(() => BranchEntity, (branch) => branch.tenant, {
    cascade: false,
    eager: false,
  })
  branches: BranchEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
