import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Entidad de persistencia para Country
 * Mapea la entidad de dominio Country a la tabla de base de datos
 */
@Entity('countries')
@Index(['code'])
@Index(['currencyCode'])
export class CountryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255 })
  name: string; // Nombre del país (ej: "Estados Unidos", "Guatemala")

  @Column('varchar', { length: 2, nullable: true })
  code: string | null; // Código ISO de 2 letras (ej: "US", "GT") - opcional

  @Column('varchar', { length: 3 })
  currencyCode: string; // Código ISO de 3 letras de la moneda (ej: "USD", "GTQ")

  @Column('varchar', { length: 20, default: 'active' })
  status: 'active' | 'inactive';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
