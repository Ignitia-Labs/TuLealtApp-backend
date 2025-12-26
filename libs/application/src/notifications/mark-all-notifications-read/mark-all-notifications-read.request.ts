import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para marcar todas las notificaciones como leídas
 */
export class MarkAllNotificationsReadRequest {
  @ApiProperty({
    description: 'ID del usuario',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  userId: number;
}

