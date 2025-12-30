import { ApiProperty } from '@nestjs/swagger';
import { PartnerMessage } from '@libs/domain';
import { DeliveryStatsDto } from '../dto/delivery-stats.dto';

/**
 * DTO de response para actualizar un mensaje
 */
export class UpdateMessageResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Asunto actualizado' })
  subject: string;

  @ApiProperty({ example: 'Cuerpo actualizado...' })
  body: string;

  @ApiProperty({ example: 'informative' })
  type: string;

  @ApiProperty({ example: 'notification' })
  channel: string;

  @ApiProperty({ example: 'single' })
  recipientType: string;

  @ApiProperty({ example: 3 })
  totalRecipients: number;

  @ApiProperty({ example: 1 })
  senderId: number;

  @ApiProperty({ example: 1, nullable: true })
  templateId: number | null;

  @ApiProperty({ example: '2024-11-20T10:00:00.000Z', nullable: true })
  scheduledAt: Date | null;

  @ApiProperty({ example: '2024-11-20T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: null, nullable: true })
  sentAt: Date | null;

  @ApiProperty({ example: 'draft' })
  status: string;

  @ApiProperty({ example: null, nullable: true })
  notes: string | null;

  @ApiProperty({ example: ['payment', 'reminder'], type: [String] })
  tags: string[];

  @ApiProperty({ example: [], type: [Object] })
  attachments: any[];

  @ApiProperty({ type: DeliveryStatsDto })
  deliveryStats: DeliveryStatsDto;

  constructor(
    message: PartnerMessage,
    deliveryStats: { sent: number; delivered: number; read: number; failed: number },
  ) {
    this.id = message.id;
    this.subject = message.subject;
    this.body = message.body;
    this.type = message.type;
    this.channel = message.channel;
    this.recipientType = message.recipientType;
    this.totalRecipients = message.totalRecipients;
    this.senderId = message.senderId;
    this.templateId = message.templateId;
    this.scheduledAt = message.scheduledAt;
    this.createdAt = message.createdAt;
    this.sentAt = message.sentAt;
    this.status = message.status;
    this.notes = message.notes;
    this.tags = message.tags;
    this.attachments = message.attachments;
    this.deliveryStats = new DeliveryStatsDto(
      deliveryStats.sent,
      deliveryStats.delivered,
      deliveryStats.read,
      deliveryStats.failed,
    );
  }
}

