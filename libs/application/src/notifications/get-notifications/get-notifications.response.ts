import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de notificación para respuesta
 */
export class NotificationDto {
  @ApiProperty({
    description: 'ID único de la notificación',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID del usuario destinatario de la notificación',
    example: 1,
    type: Number,
  })
  userId: number;

  @ApiProperty({
    description: 'Tipo de notificación',
    example: 'points_earned',
    enum: [
      'points_earned',
      'points_redeemed',
      'reward_available',
      'reward_expiring',
      'tier_upgrade',
      'tier_downgrade',
      'promotion',
      'system',
      'transaction',
      'custom',
    ],
    enumName: 'NotificationType',
  })
  type: string;

  @ApiProperty({
    description: 'Título de la notificación',
    example: '¡Ganaste puntos!',
    type: String,
  })
  title: string;

  @ApiProperty({
    description: 'Mensaje de la notificación',
    example: 'Has ganado 100 puntos por tu compra',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'Datos adicionales de la notificación (objeto JSON)',
    example: { points: 100, transactionId: 'tx-1' },
    type: Object,
    nullable: true,
  })
  data: Record<string, any> | null;

  @ApiProperty({
    description: 'Indica si la notificación ha sido leída',
    example: false,
    type: Boolean,
  })
  read: boolean;

  @ApiProperty({
    description: 'Fecha de creación de la notificación',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  constructor(
    id: number,
    userId: number,
    type: string,
    title: string,
    message: string,
    data: Record<string, any> | null,
    read: boolean,
    createdAt: Date,
  ) {
    this.id = id;
    this.userId = userId;
    this.type = type;
    this.title = title;
    this.message = message;
    this.data = data;
    this.read = read;
    this.createdAt = createdAt;
  }
}

/**
 * DTO de response para obtener notificaciones
 */
export class GetNotificationsResponse {
  @ApiProperty({
    description: 'Lista de notificaciones',
    type: NotificationDto,
    isArray: true,
  })
  notifications: NotificationDto[];

  @ApiProperty({
    description: 'Total de notificaciones no leídas',
    example: 5,
    type: Number,
  })
  unreadCount: number;

  constructor(notifications: NotificationDto[], unreadCount: number) {
    this.notifications = notifications;
    this.unreadCount = unreadCount;
  }
}
