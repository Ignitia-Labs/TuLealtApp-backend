import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { PartnerMessageEntity } from '@libs/infrastructure/entities/communication/partner-message.entity';
import { PartnerEntity } from '@libs/infrastructure/entities/partner/partner.entity';

/**
 * Entidad de persistencia para MessageRecipient
 * Almacena la relación entre mensajes y partners destinatarios
 */
@Entity('message_recipients')
@Unique(['messageId', 'partnerId'])
@Index(['messageId'])
@Index(['partnerId'])
@Index(['status'])
@Index(['readAt'])
export class MessageRecipientEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PartnerMessageEntity, (message) => message.recipients, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'messageId' })
  message: PartnerMessageEntity;

  @Column('int')
  messageId: number;

  @ManyToOne(() => PartnerEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerEntity;

  @Column('int')
  partnerId: number;

  @Column('varchar', { length: 50, default: 'sent' })
  status: 'sent' | 'delivered' | 'read' | 'failed';

  @Column('timestamp', { nullable: true })
  sentAt: Date | null;

  @Column('timestamp', { nullable: true })
  deliveredAt: Date | null;

  @Column('timestamp', { nullable: true })
  readAt: Date | null;

  @Column('text', { nullable: true })
  failureReason: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
