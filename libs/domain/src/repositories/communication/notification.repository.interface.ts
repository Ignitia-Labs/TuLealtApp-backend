import { Notification } from '@libs/domain/entities/communication/notification.entity';

/**
 * Interfaz del repositorio de Notification
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface INotificationRepository {
  /**
   * Busca una notificación por su ID
   */
  findById(id: number): Promise<Notification | null>;

  /**
   * Busca todas las notificaciones de un usuario
   */
  findByUserId(userId: number, skip?: number, take?: number): Promise<Notification[]>;

  /**
   * Busca notificaciones no leídas de un usuario
   */
  findUnreadByUserId(userId: number): Promise<Notification[]>;

  /**
   * Cuenta notificaciones no leídas de un usuario
   */
  countUnreadByUserId(userId: number): Promise<number>;

  /**
   * Guarda una nueva notificación
   */
  save(notification: Notification): Promise<Notification>;

  /**
   * Actualiza una notificación existente
   */
  update(notification: Notification): Promise<Notification>;

  /**
   * Marca todas las notificaciones de un usuario como leídas
   */
  markAllAsRead(userId: number): Promise<void>;

  /**
   * Elimina una notificación por su ID
   */
  delete(id: number): Promise<void>;
}
