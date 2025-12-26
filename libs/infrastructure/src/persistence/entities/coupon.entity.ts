import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Entidad de persistencia para Coupon
 * Almacena los cupones de descuento
 */
@Entity('coupons')
@Index(['status'])
export class CouponEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 50, unique: true })
  code: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('text')
  description: string;

  @Column('varchar', { length: 20 })
  discountType: 'percentage' | 'fixed_amount';

  @Column('decimal', { precision: 10, scale: 2 })
  discountValue: number;

  @Column('varchar', { length: 10, nullable: true })
  currency: string | null;

  @Column('json')
  applicableFrequencies: ('monthly' | 'quarterly' | 'semiannual' | 'annual')[];

  @Column('int', { nullable: true })
  maxUses: number | null; // null para ilimitado

  @Column('int', { default: 0 })
  currentUses: number;

  @Column('int', { nullable: true })
  maxUsesPerPartner: number | null;

  @Column('datetime')
  validFrom: Date;

  @Column('datetime', { nullable: true })
  validUntil: Date | null;

  @Column('varchar', { length: 20, default: 'active' })
  status: 'active' | 'inactive' | 'expired';

  @Column('int', { nullable: true })
  createdBy: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

