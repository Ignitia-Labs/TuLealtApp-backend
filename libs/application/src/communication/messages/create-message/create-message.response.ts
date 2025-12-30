import { ApiProperty } from '@nestjs/swagger';
import { PartnerMessage } from '@libs/domain';
import { DeliveryStatsDto } from '../dto/delivery-stats.dto';

/**
 * DTO de response para crear un mensaje
 */
export class CreateMessageResponse {
  @ApiProperty({ example: 9 })
  id: number;

  @ApiProperty({ example: 'Asunto del mensaje' })
  subject: string;

  @ApiProperty({ example: 'Cuerpo del mensaje...' })
  body: string;

  @ApiProperty({ example: 'informative' })
  type: string;

  @ApiProperty({ example: 'notification' })
  channel: string;

  @ApiProperty({ example: 'single' })
  recipientType: string;

  @ApiProperty({ example: [1, 2, 3], type: [Number] })
  partnerIds: number[];

  @ApiProperty({ example: ['Acme Corp', 'TechStart Inc'], type: [String] })
  partnerNames: string[];

  @ApiProperty({ example: 3 })
  totalRecipients: number;

  @ApiProperty({ example: 1 })
  senderId: number;

  @ApiProperty({ example: 1, nullable: true })
  templateId: number | null;

  @ApiProperty({ example: '2024-11-20T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-11-20T10:00:01.000Z', nullable: true })
  sentAt: Date | null;

  @ApiProperty({ example: 'sent' })
  status: string;

  @ApiProperty({ type: DeliveryStatsDto })
  deliveryStats: DeliveryStatsDto;

  @ApiProperty({ example: ['payment', 'reminder'], type: [String] })
  tags: string[];

  constructor(
    message: PartnerMessage,
    partnerIds: number[],
    partnerNames: string[],
    deliveryStats: { sent: number; delivered: number; read: number; failed: number },
  ) {
    this.id = message.id;
    this.subject = message.subject;
    this.body = message.body;
    this.type = message.type;
    this.channel = message.channel;
    this.recipientType = message.recipientType;
    this.partnerIds = partnerIds;
    this.partnerNames = partnerNames;
    this.totalRecipients = message.totalRecipients;
    this.senderId = message.senderId;
    this.templateId = message.templateId;
    this.createdAt = message.createdAt;
    this.sentAt = message.sentAt;
    this.status = message.status;
    this.deliveryStats = new DeliveryStatsDto(
      deliveryStats.sent,
      deliveryStats.delivered,
      deliveryStats.read,
      deliveryStats.failed,
    );
    this.tags = message.tags;
  }
}

