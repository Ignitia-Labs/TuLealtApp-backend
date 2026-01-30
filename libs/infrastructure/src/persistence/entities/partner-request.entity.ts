import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { CountryEntity } from './country.entity';
import { CurrencyEntity } from './currency.entity';

/**
 * Entidad de persistencia para PartnerRequest
 * Almacena las solicitudes de onboarding de partners
 */
@Entity('partner_requests')
@Index(['status'])
@Index(['submittedAt'])
export class PartnerRequestEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 20, default: 'pending' })
  status: 'pending' | 'in-progress' | 'enrolled' | 'rejected';

  @Column('datetime')
  submittedAt: Date;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 255 })
  responsibleName: string;

  @Column('varchar', { length: 255 })
  email: string;

  @Column('varchar', { length: 50 })
  phone: string;

  @ManyToOne(() => CountryEntity, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'countryId' })
  country: CountryEntity | null;

  @Column('int', { nullable: true })
  countryId: number | null;

  @Column('varchar', { length: 100 })
  city: string;

  @Column('varchar', { length: 50 })
  plan: string;

  @Column('int', { nullable: true })
  planId: number | null;

  @Column('varchar', { length: 20, nullable: true })
  billingFrequency: 'monthly' | 'quarterly' | 'semiannual' | 'annual' | null;

  @Column('text', { nullable: true })
  logo: string | null;

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

  @Column('int', { nullable: true })
  subscriptionCurrencyId: number | null;

  @Column('int', { nullable: true })
  trialDays: number | null;

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

  @Column('text', { nullable: true })
  notes: string | null;

  @Column('int', { nullable: true })
  assignedTo: number | null;

  @Column('int', { nullable: true })
  updatedBy: number | null;

  @Column('datetime')
  lastUpdated: Date;

  @Column('varchar', { length: 20, default: 'internal' })
  source: 'public' | 'internal';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
