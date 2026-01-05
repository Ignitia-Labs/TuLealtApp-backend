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
 * Entidad de persistencia para SavedPaymentMethod
 * Almacena los métodos de pago guardados de partners
 */
@Entity('saved_payment_methods')
@Index(['partnerId'])
@Index(['isDefault'])
export class SavedPaymentMethodEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PartnerEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerEntity;

  @Column('int')
  partnerId: number;

  @Column('varchar', { length: 50 })
  type: 'credit_card' | 'bank_transfer' | 'debit_card';

  @Column('varchar', { length: 4, nullable: true })
  cardLastFour: string | null;

  @Column('varchar', { length: 50, nullable: true })
  cardBrand: string | null;

  @Column('varchar', { length: 7, nullable: true })
  cardExpiry: string | null;

  @Column('varchar', { length: 255, nullable: true })
  cardHolderName: string | null;

  @Column('varchar', { length: 100, nullable: true })
  bankName: string | null;

  @Column('varchar', { length: 4, nullable: true })
  accountLastFour: string | null;

  @Column('varchar', { length: 20, nullable: true })
  accountType: 'checking' | 'savings' | null;

  @Column('boolean', { default: false })
  isDefault: boolean;

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('varchar', { length: 50, nullable: true })
  gateway: string | null;

  @Column('varchar', { length: 100, nullable: true })
  gatewayCustomerId: string | null;

  @Column('varchar', { length: 100, nullable: true })
  gatewayPaymentMethodId: string | null;

  @Column('varchar', { length: 100, nullable: true })
  nickname: string | null;

  @Column('datetime', { nullable: true })
  lastUsedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
