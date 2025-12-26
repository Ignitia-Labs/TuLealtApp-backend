import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para marcar notificación como leída
 */
export class MarkNotificationReadRequest {
  @ApiProperty({
    description: 'ID de la notificación',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  notificationId: number;
}

