import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de destinatario para response
 */
export class RecipientDto {
  @ApiProperty({ example: 1 })
  messageId: number;

  @ApiProperty({ example: 1 })
  partnerId: number;

  @ApiProperty({ example: 'Acme Corp' })
  partnerName: string;

  @ApiProperty({ example: 'contact@acmecorp.com' })
  partnerEmail: string;

  @ApiProperty({ example: 'read' })
  status: string;

  @ApiProperty({ example: '2024-11-20T09:31:00.000Z', nullable: true })
  sentAt: Date | null;

  @ApiProperty({ example: '2024-11-20T09:31:30.000Z', nullable: true })
  deliveredAt: Date | null;

  @ApiProperty({ example: '2024-11-20T10:15:00.000Z', nullable: true })
  readAt: Date | null;

  @ApiProperty({ example: null, nullable: true })
  failureReason: string | null;

  constructor(
    messageId: number,
    partnerId: number,
    partnerName: string,
    partnerEmail: string,
    status: string,
    sentAt: Date | null,
    deliveredAt: Date | null,
    readAt: Date | null,
    failureReason: string | null,
  ) {
    this.messageId = messageId;
    this.partnerId = partnerId;
    this.partnerName = partnerName;
    this.partnerEmail = partnerEmail;
    this.status = status;
    this.sentAt = sentAt;
    this.deliveredAt = deliveredAt;
    this.readAt = readAt;
    this.failureReason = failureReason;
  }
}

/**
 * DTO de response para obtener destinatarios
 */
export class GetRecipientsResponse {
  @ApiProperty({ type: [RecipientDto] })
  recipients: RecipientDto[];

  @ApiProperty({ example: 1 })
  total: number;

  constructor(recipients: RecipientDto[], total: number) {
    this.recipients = recipients;
    this.total = total;
  }
}
