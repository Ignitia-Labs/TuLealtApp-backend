import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Entidad de persistencia para RateExchange
 * Almacena el tipo de cambio entre GTQ y USD
 * Solo debe existir un registro activo en la base de datos
 */
@Entity('rate_exchanges')
export class RateExchangeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', {
    precision: 10,
    scale: 4,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => {
        if (typeof value === 'number') {
          return value;
        }
        return parseFloat(value || '0');
      },
    },
  })
  rate: number; // GTQ por USD

  @Column('varchar', { length: 3, default: 'GTQ' })
  fromCurrency: string;

  @Column('varchar', { length: 3, default: 'USD' })
  toCurrency: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

