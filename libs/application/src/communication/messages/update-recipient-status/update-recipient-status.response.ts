import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para actualizar estado de destinatario
 */
export class UpdateRecipientStatusResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: Object })
  recipient: {
    messageId: number;
    partnerId: number;
    partnerName: string;
    partnerEmail: string;
    status: string;
    sentAt: Date | null;
    deliveredAt: Date | null;
    readAt: Date | null;
    failureReason: string | null;
  };

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
    this.success = true;
    this.recipient = {
      messageId,
      partnerId,
      partnerName,
      partnerEmail,
      status,
      sentAt,
      deliveredAt,
      readAt,
      failureReason,
    };
  }
}

