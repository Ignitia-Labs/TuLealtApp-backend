/**
 * Entidad de dominio SubscriptionEvent
 * Representa un evento en el historial de una suscripción
 * No depende de frameworks ni librerías externas
 */
export type SubscriptionEventType =
  | 'created'
  | 'activated'
  | 'suspended'
  | 'cancelled'
  | 'renewed'
  | 'payment_received'
  | 'payment_failed'
  | 'payment_retry'
  | 'plan_changed'
  | 'plan_upgraded'
  | 'plan_downgraded'
  | 'paused'
  | 'resumed'
  | 'expired'
  | 'trial_started'
  | 'trial_ended'
  | 'invoice_generated'
  | 'refund_issued'
  | 'credit_applied'
  | 'limit_reached'
  | 'usage_alert'
  | 'custom';

export class SubscriptionEvent {
  constructor(
    public readonly id: number,
    public readonly subscriptionId: number,
    public readonly partnerId: number,
    public readonly type: SubscriptionEventType,
    public readonly title: string,
    public readonly description: string,
    public readonly paymentId: number | null,
    public readonly invoiceId: number | null,
    public readonly metadata: Record<string, any> | null,
    public readonly occurredAt: Date,
    public readonly createdAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo evento de suscripción
   */
  static create(
    subscriptionId: number,
    partnerId: number,
    type: SubscriptionEventType,
    title: string,
    description: string,
    occurredAt: Date = new Date(),
    paymentId: number | null = null,
    invoiceId: number | null = null,
    metadata: Record<string, any> | null = null,
    id?: number,
  ): SubscriptionEvent {
    const now = new Date();
    return new SubscriptionEvent(
      id || 0,
      subscriptionId,
      partnerId,
      type,
      title,
      description,
      paymentId,
      invoiceId,
      metadata,
      occurredAt,
      now,
    );
  }
}

