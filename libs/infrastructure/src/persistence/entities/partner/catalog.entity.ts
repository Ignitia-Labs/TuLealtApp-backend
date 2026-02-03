import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Entidad de persistencia para Catalog
 * Mapea la entidad de dominio Catalog a la tabla de base de datos
 */
@Entity('catalogs')
@Index(['type', 'isActive'])
@Index(['type', 'displayOrder'])
@Index(['slug'], { unique: true })
export class CatalogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 50 })
  type:
    | 'BUSINESS_CATEGORIES'
    | 'REWARD_TYPES'
    | 'LOYALTY_PROGRAM_TYPES'
    | 'PAYMENT_METHODS'
    | 'PAYMENT_CATEGORIES';

  @Column('varchar', { length: 255 })
  value: string;

  @Column('varchar', { length: 255, nullable: false })
  slug: string;

  @Column('int', { default: 0 })
  displayOrder: number;

  @Column('boolean', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
