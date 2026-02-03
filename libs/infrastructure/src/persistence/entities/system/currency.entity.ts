import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CountryEntity } from '@libs/infrastructure/entities/system/country.entity';

/**
 * Entidad de persistencia para Currency
 * Mapea la entidad de dominio Currency a la tabla de base de datos
 */
@Entity('currencies')
export class CurrencyEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 3, unique: true })
  code: string; // Código ISO de 3 letras (ej: USD, GTQ)

  @Column('varchar', { length: 255 })
  name: string; // Nombre completo de la moneda

  @Column('varchar', { length: 10 })
  symbol: string; // Símbolo de la moneda (ej: $, €)

  @Column('varchar', { length: 10 })
  symbolPosition: 'before' | 'after'; // Posición del símbolo

  @Column('int')
  decimalPlaces: number; // Número de decimales

  @Column('varchar', { length: 20, default: 'active' })
  status: 'active' | 'inactive';

  @ManyToOne(() => CountryEntity, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'countryId' })
  country: CountryEntity | null;

  @Column('int', { nullable: true })
  countryId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
