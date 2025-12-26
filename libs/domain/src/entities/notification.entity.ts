/**
 * Entidad de dominio Notification
 * Representa una notificación para un usuario
 * No depende de frameworks ni librerías externas
 */
export type NotificationType =
  | 'points_earned'
  | 'points_redeemed'
  | 'reward_available'
  | 'reward_expiring'
  | 'tier_upgrade'
  | 'tier_downgrade'
  | 'promotion'
  | 'system'
  | 'transaction'
  | 'custom';

export class Notification {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly type: NotificationType,
    public readonly title: string,
    public readonly message: string,
    public readonly data: Record<string, any> | null,
    public readonly read: boolean,
    public readonly createdAt: Date,
  ) {}

  /**
   * Factory method para crear una nueva notificación
   */
  static create(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    data: Record<string, any> | null = null,
    read: boolean = false,
    id?: number,
  ): Notification {
    const now = new Date();
    return new Notification(id || 0, userId, type, title, message, data, read, now);
  }

  /**
   * Método de dominio para marcar la notificación como leída
   */
  markAsRead(): Notification {
    return new Notification(
      this.id,
      this.userId,
      this.type,
      this.title,
      this.message,
      this.data,
      true,
      this.createdAt,
    );
  }

  /**
   * Método de dominio para marcar la notificación como no leída
   */
  markAsUnread(): Notification {
    return new Notification(
      this.id,
      this.userId,
      this.type,
      this.title,
      this.message,
      this.data,
      false,
      this.createdAt,
    );
  }

  /**
   * Método de dominio para verificar si la notificación está leída
   */
  isRead(): boolean {
    return this.read;
  }
}

