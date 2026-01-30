import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { LoyaltyProgramEntity } from './loyalty-program.entity';

/**
 * Entidad de persistencia para LoyaltyProgramEarningDomain
 * Representa un dominio de earning asociado a un programa de lealtad
 */
@Entity('loyalty_program_earning_domains')
@Index('IDX_LOYALTY_PROGRAM_EARNING_DOMAINS_PROGRAM_ID', ['programId'])
@Index('IDX_LOYALTY_PROGRAM_EARNING_DOMAINS_DOMAIN', ['domain'])
@Index('UK_LOYALTY_PROGRAM_EARNING_DOMAINS_PROGRAM_DOMAIN', ['programId', 'domain'], { unique: true })
export class LoyaltyProgramEarningDomainEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => LoyaltyProgramEntity, (program) => program.earningDomainsRelation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'program_id' })
  program: LoyaltyProgramEntity;

  @Column('int', { name: 'program_id' })
  programId: number;

  @Column('varchar', { length: 50 })
  domain: string; // Debe ser del catálogo de EarningDomain
}
