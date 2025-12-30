import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { MessageTemplateEntity } from './message-template.entity';
import { MessageRecipientEntity } from './message-recipient.entity';
import { MessageFilterEntity } from './message-filter.entity';

/**
 * Entidad de persistencia para PartnerMessage
 * Almacena los mensajes enviados a los partners
 */
@Entity('partner_messages')
@Index(['senderId'])
@Index(['templateId'])
@Index(['status'])
@Index(['type'])
@Index(['channel'])
@Index(['createdAt'])
@Index(['scheduledAt'])
export class PartnerMessageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  subject: string;

  @Column('text')
  body: string;

  @Column('varchar', { length: 50 })
  type: 'urgent' | 'informative' | 'promotional' | 'payment_reminder' | 'general';

  @Column('varchar', { length: 50 })
  channel: 'notification' | 'email' | 'whatsapp' | 'sms';

  @Column('varchar', { length: 50 })
  recipientType: 'single' | 'broadcast' | 'filtered';

  @Column('int', { default: 0 })
  totalRecipients: number;

  @ManyToOne(() => UserEntity, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'senderId' })
  sender: UserEntity;

  @Column('int')
  senderId: number;

  @ManyToOne(() => MessageTemplateEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'templateId' })
  template: MessageTemplateEntity | null;

  @Column('int', { nullable: true })
  templateId: number | null;

  @Column('timestamp', { nullable: true })
  scheduledAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column('timestamp', { nullable: true })
  sentAt: Date | null;

  @Column('varchar', { length: 50, default: 'draft' })
  status: 'draft' | 'sent' | 'delivered' | 'read' | 'failed';

  @Column('text', { nullable: true })
  notes: string | null;

  @Column('json', { nullable: true })
  tags: string[] | null;

  @Column('json', { nullable: true })
  attachments: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }> | null;

  @OneToMany(() => MessageRecipientEntity, (recipient) => recipient.message, {
    cascade: true,
  })
  recipients: MessageRecipientEntity[];

  @OneToMany(() => MessageFilterEntity, (filter) => filter.message, {
    cascade: true,
  })
  filters: MessageFilterEntity[];
}

