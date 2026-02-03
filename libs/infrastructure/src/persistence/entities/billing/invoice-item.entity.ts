import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InvoiceEntity } from '@libs/infrastructure/entities/billing/invoice.entity';

/**
 * Entidad de persistencia para InvoiceItem
 * Almacena los items de una factura
 */
@Entity('invoice_items')
export class InvoiceItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => InvoiceEntity, (invoice) => invoice.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice: InvoiceEntity;

  @Column('int')
  invoiceId: number;

  @Column('varchar', { length: 100 })
  itemId: string; // ID único del item dentro de la factura

  @Column('text')
  description: string;

  @Column('int', { default: 1 })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 5, scale: 2 })
  taxRate: number;

  @Column('decimal', { precision: 10, scale: 2 })
  taxAmount: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  discountPercent: number | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  discountAmount: number | null;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
