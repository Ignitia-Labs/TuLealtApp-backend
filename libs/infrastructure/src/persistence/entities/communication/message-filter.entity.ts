import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { PartnerMessageEntity } from '@libs/infrastructure/entities/communication/partner-message.entity';

/**
 * Entidad de persistencia para MessageFilter
 * Almacena los criterios de filtrado para mensajes tipo 'filtered'
 */
@Entity('message_filters')
@Index(['messageId'])
export class MessageFilterEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PartnerMessageEntity, (message) => message.filters, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'messageId' })
  message: PartnerMessageEntity;

  @Column('int')
  messageId: number;

  @Column('varchar', { length: 50 })
  filterType: 'plan' | 'country' | 'status' | 'date_range' | 'category' | 'custom';

  @Column('json')
  filterValue: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
