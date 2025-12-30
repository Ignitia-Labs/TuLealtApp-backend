import { ApiProperty } from '@nestjs/swagger';
import { PartnerMessage } from '@libs/domain';
import { DeliveryStatsDto } from '../dto/delivery-stats.dto';

/**
 * DTO de mensaje para response
 */
export class MessageDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Recordatorio: Pago de Suscripción Pendiente' })
  subject: string;

  @ApiProperty({ example: 'Hola Acme Corp, te recordamos...' })
  body: string;

  @ApiProperty({ example: 'payment_reminder' })
  type: string;

  @ApiProperty({ example: 'notification' })
  channel: string;

  @ApiProperty({ example: 'single' })
  recipientType: string;

  @ApiProperty({ example: [1], type: [Number] })
  partnerIds: number[];

  @ApiProperty({ example: ['Acme Corp'], type: [String] })
  partnerNames: string[];

  @ApiProperty({ example: 1 })
  totalRecipients: number;

  @ApiProperty({ example: 1 })
  senderId: number;

  @ApiProperty({ example: 'Admin Principal' })
  senderName: string;

  @ApiProperty({ example: 'webmaster' })
  senderRole: string;

  @ApiProperty({ example: 1, nullable: true })
  templateId: number | null;

  @ApiProperty({ example: 'Recordatorio de Pago', nullable: true })
  templateName: string | null;

  @ApiProperty({ example: '2024-11-20T09:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-11-20T09:31:00.000Z', nullable: true })
  sentAt: Date | null;

  @ApiProperty({ example: 'read' })
  status: string;

  @ApiProperty({ type: DeliveryStatsDto })
  deliveryStats: DeliveryStatsDto;

  @ApiProperty({ example: ['payment', 'reminder'], type: [String] })
  tags: string[];

  constructor(
    message: PartnerMessage,
    partnerIds: number[],
    partnerNames: string[],
    senderName: string,
    senderRole: string,
    templateName: string | null,
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
    this.senderName = senderName;
    this.senderRole = senderRole;
    this.templateId = message.templateId;
    this.templateName = templateName;
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

/**
 * DTO de paginación
 */
export class PaginationDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 8 })
  total: number;

  @ApiProperty({ example: 1 })
  totalPages: number;

  constructor(page: number, limit: number, total: number) {
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.totalPages = Math.ceil(total / limit);
  }
}

/**
 * DTO de response para obtener mensajes
 */
export class GetMessagesResponse {
  @ApiProperty({ type: [MessageDto] })
  messages: MessageDto[];

  @ApiProperty({ type: PaginationDto })
  pagination: PaginationDto;

  constructor(
    messages: MessageDto[],
    page: number,
    limit: number,
    total: number,
  ) {
    this.messages = messages;
    this.pagination = new PaginationDto(page, limit, total);
  }
}

