import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '@libs/infrastructure/entities/auth/user.entity';

/**
 * Entidad de persistencia para MessageTemplate
 * Almacena las plantillas de mensajes predefinidas
 */
@Entity('message_templates')
@Index(['type'])
@Index(['isActive'])
export class MessageTemplateEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 50 })
  type: 'urgent' | 'informative' | 'promotional' | 'payment_reminder' | 'general';

  @Column('text')
  subject: string;

  @Column('text')
  body: string;

  @Column('json')
  variables: string[];

  @Column('int', { default: 0 })
  usageCount: number;

  @ManyToOne(() => UserEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity | null;

  @Column('int', { nullable: true })
  createdBy: number | null;

  @Column('boolean', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
