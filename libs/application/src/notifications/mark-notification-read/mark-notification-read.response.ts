import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para marcar notificación como leída
 */
export class MarkNotificationReadResponse {
  @ApiProperty({
    description: 'ID de la notificación',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Indica si la notificación está leída',
    example: true,
    type: Boolean,
  })
  read: boolean;

  constructor(id: number, read: boolean) {
    this.id = id;
    this.read = read;
  }
}
