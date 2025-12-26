/**
 * Entidad de dominio SubscriptionAlert
 * Representa una alerta relacionada con una suscripción
 * No depende de frameworks ni librerías externas
 */
export type AlertType =
  | 'renewal'
  | 'payment_failed'
  | 'payment_due'
  | 'usage_warning'
  | 'limit_reached'
  | 'trial_ending'
  | 'expiring'
  | 'custom';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'dismissed' | 'resolved';

export class SubscriptionAlert {
  constructor(
    public readonly id: number,
    public readonly subscriptionId: number,
    public readonly partnerId: number,
    public readonly type: AlertType,
    public readonly severity: AlertSeverity,
    public readonly title: string,
    public readonly message: string,
    public readonly actionRequired: boolean,
    public readonly actionLabel: string | null,
    public readonly actionUrl: string | null,
    public readonly status: AlertStatus,
    public readonly notifyEmail: boolean,
    public readonly notifyPush: boolean,
    public readonly emailSentAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear una nueva alerta
   */
  static create(
    subscriptionId: number,
    partnerId: number,
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    message: string,
    actionRequired: boolean = false,
    actionLabel: string | null = null,
    actionUrl: string | null = null,
    status: AlertStatus = 'active',
    notifyEmail: boolean = true,
    notifyPush: boolean = true,
    id?: number,
  ): SubscriptionAlert {
    const now = new Date();
    return new SubscriptionAlert(
      id || 0,
      subscriptionId,
      partnerId,
      type,
      severity,
      title,
      message,
      actionRequired,
      actionLabel,
      actionUrl,
      status,
      notifyEmail,
      notifyPush,
      null,
      now,
      now,
    );
  }

  /**
   * Método de dominio para marcar la alerta como resuelta
   */
  resolve(): SubscriptionAlert {
    return new SubscriptionAlert(
      this.id,
      this.subscriptionId,
      this.partnerId,
      this.type,
      this.severity,
      this.title,
      this.message,
      this.actionRequired,
      this.actionLabel,
      this.actionUrl,
      'resolved',
      this.notifyEmail,
      this.notifyPush,
      this.emailSentAt,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para descartar la alerta
   */
  dismiss(): SubscriptionAlert {
    return new SubscriptionAlert(
      this.id,
      this.subscriptionId,
      this.partnerId,
      this.type,
      this.severity,
      this.title,
      this.message,
      this.actionRequired,
      this.actionLabel,
      this.actionUrl,
      'dismissed',
      this.notifyEmail,
      this.notifyPush,
      this.emailSentAt,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para marcar el email como enviado
   */
  markEmailSent(): SubscriptionAlert {
    return new SubscriptionAlert(
      this.id,
      this.subscriptionId,
      this.partnerId,
      this.type,
      this.severity,
      this.title,
      this.message,
      this.actionRequired,
      this.actionLabel,
      this.actionUrl,
      this.status,
      this.notifyEmail,
      this.notifyPush,
      new Date(),
      this.createdAt,
      new Date(),
    );
  }
}

