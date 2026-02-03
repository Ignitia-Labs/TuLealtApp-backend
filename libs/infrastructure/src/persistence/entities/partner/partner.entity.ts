import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { PartnerSubscriptionEntity } from '@libs/infrastructure/entities/partner/partner-subscription.entity';
import { TenantEntity } from '@libs/infrastructure/entities/system/tenant.entity';
import { CurrencyEntity } from '@libs/infrastructure/entities/system/currency.entity';
import { CountryEntity } from '@libs/infrastructure/entities/system/country.entity';

/**
 * Entidad de persistencia para Partner
 * Mapea la entidad de dominio Partner a la tabla de base de datos
 */
@Entity('partners')
@Index('IDX_PARTNERS_EMAIL', ['email'])
@Index('IDX_PARTNERS_DOMAIN', ['domain'])
export class PartnerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 255 })
  responsibleName: string;

  @Column('varchar', { length: 255, unique: true })
  email: string;

  @Column('varchar', { length: 50 })
  phone: string;

  @ManyToOne(() => CountryEntity, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'countryId' })
  countryRelation: CountryEntity | null;

  @Column('int', { nullable: true })
  countryId: number | null;

  @Column('varchar', { length: 100, nullable: true })
  country: string | null;

  @Column('varchar', { length: 100 })
  city: string;

  @Column('varchar', { length: 50 })
  plan: string;

  @Column('text', { nullable: true })
  logo: string | null;

  @Column('text', { nullable: true })
  banner: string | null;

  @Column('varchar', { length: 100 })
  category: string;

  @Column('int', { default: 0 })
  branchesNumber: number;

  @Column('varchar', { length: 255, nullable: true })
  website: string | null;

  @Column('varchar', { length: 255, nullable: true })
  socialMedia: string | null;

  @ManyToOne(() => CurrencyEntity, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'currencyId' })
  currency: CurrencyEntity;

  @Column('int')
  currencyId: number;

  @Column('varchar', { length: 255 })
  businessName: string;

  @Column('varchar', { length: 100 })
  taxId: string;

  @Column('text')
  fiscalAddress: string;

  @Column('varchar', { length: 100 })
  paymentMethod: string;

  @Column('varchar', { length: 255 })
  billingEmail: string;

  @Column('varchar', { length: 255, unique: true })
  domain: string;

  @Column('varchar', { length: 20, default: 'active' })
  status: 'active' | 'suspended' | 'inactive';

  // Relations
  @OneToOne(() => PartnerSubscriptionEntity, (subscription) => subscription.partner, {
    cascade: false,
    eager: false,
  })
  subscription: PartnerSubscriptionEntity | null;

  // Relación con PartnerLimitsEntity eliminada - los límites ahora se obtienen desde pricing_plan_limits

  @OneToMany(() => TenantEntity, (tenant) => tenant.partner, {
    cascade: false,
    eager: false,
  })
  tenants: TenantEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
