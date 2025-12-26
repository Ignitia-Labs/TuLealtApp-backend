import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para marcar todas las notificaciones como leídas
 */
export class MarkAllNotificationsReadResponse {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'All notifications marked as read',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'ID del usuario',
    example: 1,
    type: Number,
  })
  userId: number;

  constructor(userId: number) {
    this.userId = userId;
    this.message = 'All notifications marked as read';
  }
}

