import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { CustomerTierEntity } from '@libs/infrastructure/entities/customer/customer-tier.entity';

/**
 * Entidad de persistencia para CustomerTierBenefit
 * Representa un beneficio asignado a un tier de cliente
 */
@Entity('customer_tier_benefits')
@Index('IDX_CUSTOMER_TIER_BENEFITS_TIER_ID', ['tierId'])
@Index('IDX_CUSTOMER_TIER_BENEFITS_BENEFIT', ['benefit'])
@Index('UK_CUSTOMER_TIER_BENEFITS_TIER_BENEFIT', ['tierId', 'benefit'], { unique: true })
export class CustomerTierBenefitEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CustomerTierEntity, (tier) => tier.benefitsRelation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tier_id' })
  tier: CustomerTierEntity;

  @Column('int', { name: 'tier_id' })
  tierId: number;

  @Column('varchar', { length: 255 })
  benefit: string; // Descripción del beneficio (ej: "Descuento 10%", "Envío gratis")
}
