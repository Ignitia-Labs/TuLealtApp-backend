import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para obtener estadísticas
 */
export class GetStatsResponse {
  @ApiProperty({ example: 13 })
  totalSent: number;

  @ApiProperty({ example: 13 })
  totalDelivered: number;

  @ApiProperty({ example: 8 })
  totalRead: number;

  @ApiProperty({ example: 0 })
  totalFailed: number;

  @ApiProperty({ example: 100.0 })
  deliveryRate: number;

  @ApiProperty({ example: 61.5 })
  readRate: number;

  @ApiProperty({ example: 4.2, description: 'En horas' })
  averageReadTime: number;

  @ApiProperty({
    example: {
      urgent: 1,
      informative: 7,
      promotional: 1,
      payment_reminder: 2,
      general: 2,
    },
  })
  messagesByType: Record<string, number>;

  @ApiProperty({
    example: {
      notification: 7,
      email: 5,
      whatsapp: 1,
      sms: 0,
    },
  })
  messagesByChannel: Record<string, number>;

  constructor(
    totalSent: number,
    totalDelivered: number,
    totalRead: number,
    totalFailed: number,
    deliveryRate: number,
    readRate: number,
    averageReadTime: number,
    messagesByType: Record<string, number>,
    messagesByChannel: Record<string, number>,
  ) {
    this.totalSent = totalSent;
    this.totalDelivered = totalDelivered;
    this.totalRead = totalRead;
    this.totalFailed = totalFailed;
    this.deliveryRate = deliveryRate;
    this.readRate = readRate;
    this.averageReadTime = averageReadTime;
    this.messagesByType = messagesByType;
    this.messagesByChannel = messagesByChannel;
  }
}

