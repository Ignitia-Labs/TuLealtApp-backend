import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de estadísticas de entrega
 * Compartido entre múltiples responses
 */
export class DeliveryStatsDto {
  @ApiProperty({ example: 1 })
  sent: number;

  @ApiProperty({ example: 1 })
  delivered: number;

  @ApiProperty({ example: 1 })
  read: number;

  @ApiProperty({ example: 0 })
  failed: number;

  constructor(sent: number, delivered: number, read: number, failed: number) {
    this.sent = sent;
    this.delivered = delivered;
    this.read = read;
    this.failed = failed;
  }
}

