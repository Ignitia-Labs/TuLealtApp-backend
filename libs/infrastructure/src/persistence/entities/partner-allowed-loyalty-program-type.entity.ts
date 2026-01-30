import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { PartnerEntity } from './partner.entity';
import { PartnerRequestEntity } from './partner-request.entity';

/**
 * Entidad de persistencia para PartnerAllowedLoyaltyProgramType
 * Representa un tipo de loyalty program permitido para un partner
 * Usa tabla relacional en lugar de JSON según la arquitectura del proyecto
 */
@Entity('partner_allowed_loyalty_program_types')
@Index('IDX_PARTNER_ALLOWED_TYPES_PARTNER_ID', ['partnerId'])
@Index('IDX_PARTNER_ALLOWED_TYPES_PARTNER_REQUEST_ID', ['partnerRequestId'])
@Index('IDX_PARTNER_ALLOWED_TYPES_TYPE', ['programType'])
// Constraints UNIQUE separados para evitar conflictos cuando uno de los IDs es null
// Se manejan a nivel de aplicación ya que TypeORM no soporta bien UNIQUE parciales con NULL
export class PartnerAllowedLoyaltyProgramTypeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PartnerEntity, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerEntity | null;

  @Column('int', { nullable: true })
  partnerId: number | null;

  @ManyToOne(() => PartnerRequestEntity, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'partnerRequestId' })
  partnerRequest: PartnerRequestEntity | null;

  @Column('int', { nullable: true })
  partnerRequestId: number | null;

  @Column('varchar', { length: 20 })
  programType: 'BASE' | 'PROMO' | 'PARTNER' | 'SUBSCRIPTION' | 'EXPERIMENTAL';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
