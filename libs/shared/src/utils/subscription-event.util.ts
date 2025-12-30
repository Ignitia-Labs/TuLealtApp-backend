import {
  SubscriptionEvent,
  SubscriptionEventType,
  PartnerSubscription,
  ISubscriptionEventRepository,
} from '@libs/domain';

/**
 * Opciones para crear un evento de suscripción
 */
export interface CreateSubscriptionEventOptions {
  /** Tipo de evento */
  type: SubscriptionEventType;
  /** Suscripción asociada */
  subscription: PartnerSubscription;
  /** Metadatos adicionales del evento */
  metadata?: Record<string, any>;
  /** ID del pago asociado (opcional) */
  paymentId?: number | null;
  /** ID de la factura asociada (opcional) */
  invoiceId?: number | null;
  /** Título personalizado (opcional, se genera automáticamente si no se proporciona) */
  title?: string;
  /** Descripción personalizada (opcional, se genera automáticamente si no se proporciona) */
  description?: string;
  /** Fecha de ocurrencia (opcional, por defecto es la fecha actual) */
  occurredAt?: Date;
}

/**
 * Obtiene el título del evento según su tipo
 */
export function getSubscriptionEventTitle(type: SubscriptionEventType): string {
  const titles: Record<SubscriptionEventType, string> = {
    created: 'Suscripción creada',
    activated: 'Suscripción activada',
    suspended: 'Suscripción suspendida',
    cancelled: 'Suscripción cancelada',
    renewed: 'Suscripción renovada',
    payment_received: 'Pago recibido',
    payment_failed: 'Pago fallido',
    payment_retry: 'Reintento de pago',
    plan_changed: 'Plan cambiado',
    plan_upgraded: 'Plan mejorado',
    plan_downgraded: 'Plan reducido',
    paused: 'Suscripción pausada',
    resumed: 'Suscripción reanudada',
    expired: 'Suscripción expirada',
    trial_started: 'Período de prueba iniciado',
    trial_ended: 'Período de prueba finalizado',
    invoice_generated: 'Factura generada',
    refund_issued: 'Reembolso emitido',
    credit_applied: 'Crédito aplicado',
    limit_reached: 'Límite alcanzado',
    usage_alert: 'Alerta de uso',
    custom: 'Evento personalizado',
  };

  return titles[type] || 'Evento de suscripción';
}

/**
 * Obtiene la descripción del evento según su tipo
 */
export function getSubscriptionEventDescription(
  type: SubscriptionEventType,
  subscription: PartnerSubscription,
  metadata?: Record<string, any>,
): string {
  const planType = subscription.planType;
  const billingAmount = subscription.billingAmount;
  const currency = subscription.currency;

  switch (type) {
    case 'created':
      return `Se creó una nueva suscripción para el partner ${subscription.partnerId}. Plan: ${planType}, Monto: ${billingAmount} ${currency}`;
    case 'activated':
      return `La suscripción ${subscription.id} fue activada`;
    case 'suspended':
      return `La suscripción ${subscription.id} fue suspendida`;
    case 'cancelled':
      return `La suscripción ${subscription.id} fue cancelada`;
    case 'renewed':
      return `La suscripción ${subscription.id} fue renovada exitosamente`;
    case 'payment_received':
      return `Se recibió un pago para la suscripción ${subscription.id}`;
    case 'payment_failed':
      return `Falló un pago para la suscripción ${subscription.id}`;
    case 'payment_retry':
      const retryAttempt = metadata?.retryAttempt || 'desconocido';
      return `Reintento de pago #${retryAttempt} para la suscripción ${subscription.id}`;
    case 'plan_changed':
      const oldPlan = metadata?.oldPlanType || 'desconocido';
      const newPlan = metadata?.newPlanType || planType;
      return `El plan de la suscripción ${subscription.id} cambió de ${oldPlan} a ${newPlan}`;
    case 'plan_upgraded':
      const oldPlanUpgrade = metadata?.oldPlanType || 'desconocido';
      const newPlanUpgrade = metadata?.newPlanType || planType;
      return `El plan de la suscripción ${subscription.id} fue mejorado de ${oldPlanUpgrade} a ${newPlanUpgrade}`;
    case 'plan_downgraded':
      const oldPlanDowngrade = metadata?.oldPlanType || 'desconocido';
      const newPlanDowngrade = metadata?.newPlanType || planType;
      return `El plan de la suscripción ${subscription.id} fue reducido de ${oldPlanDowngrade} a ${newPlanDowngrade}`;
    case 'paused':
      const reason = metadata?.reason || 'Sin razón especificada';
      return `La suscripción ${subscription.id} fue pausada. Razón: ${reason}`;
    case 'resumed':
      return `La suscripción ${subscription.id} fue reanudada`;
    case 'expired':
      return `La suscripción ${subscription.id} expiró`;
    case 'trial_started':
      return `Se inició el período de prueba para la suscripción ${subscription.id}`;
    case 'trial_ended':
      return `Finalizó el período de prueba para la suscripción ${subscription.id}`;
    case 'invoice_generated':
      const invoiceNumber = metadata?.invoiceNumber || 'N/A';
      return `Se generó la factura ${invoiceNumber} para la suscripción ${subscription.id}`;
    case 'refund_issued':
      const refundAmount = metadata?.amount || 'desconocido';
      return `Se emitió un reembolso de ${refundAmount} ${currency} para la suscripción ${subscription.id}`;
    case 'credit_applied':
      const creditAmount = metadata?.amount || 'desconocido';
      return `Se aplicó un crédito de ${creditAmount} ${currency} a la suscripción ${subscription.id}`;
    case 'limit_reached':
      const limitType = metadata?.limitType || 'desconocido';
      return `Se alcanzó el límite de ${limitType} para la suscripción ${subscription.id}`;
    case 'usage_alert':
      const alertType = metadata?.alertType || 'desconocido';
      return `Alerta de uso: ${alertType} para la suscripción ${subscription.id}`;
    case 'custom':
      return metadata?.description || 'Evento personalizado';
    default:
      return `Evento ${type} para la suscripción ${subscription.id}`;
  }
}

/**
 * Crea un objeto SubscriptionEvent sin guardarlo en la base de datos
 * Útil para crear el evento y luego guardarlo manualmente o para testing
 *
 * @example
 * ```typescript
 * const event = createSubscriptionEvent({
 *   type: 'payment_received',
 *   subscription: mySubscription,
 *   paymentId: 123,
 *   metadata: { amount: 100, currency: 'USD' }
 * });
 * await repository.save(event);
 * ```
 */
export function createSubscriptionEvent(
  options: CreateSubscriptionEventOptions,
): SubscriptionEvent {
  const {
    type,
    subscription,
    metadata,
    paymentId = null,
    invoiceId = null,
    title,
    description,
    occurredAt = new Date(),
  } = options;

  const eventTitle = title || getSubscriptionEventTitle(type);
  const eventDescription = description || getSubscriptionEventDescription(type, subscription, metadata);

  return SubscriptionEvent.create(
    subscription.id,
    subscription.partnerId,
    type,
    eventTitle,
    eventDescription,
    occurredAt,
    paymentId,
    invoiceId,
    metadata || null,
  );
}

/**
 * Crea y guarda un evento de suscripción en la base de datos
 * Esta función requiere el repositorio para poder guardar el evento
 *
 * @example
 * ```typescript
 * // Uso básico con título y descripción automáticos
 * await registerSubscriptionEvent({
 *   type: 'payment_received',
 *   subscription: mySubscription,
 *   paymentId: 123
 * }, subscriptionEventRepository);
 *
 * // Uso con metadatos personalizados
 * await registerSubscriptionEvent({
 *   type: 'plan_changed',
 *   subscription: mySubscription,
 *   metadata: {
 *     oldPlanType: 'basic',
 *     newPlanType: 'premium',
 *     oldPlanId: 1,
 *     newPlanId: 2
 *   }
 * }, subscriptionEventRepository);
 *
 * // Uso con título y descripción personalizados
 * await registerSubscriptionEvent({
 *   type: 'custom',
 *   subscription: mySubscription,
 *   title: 'Evento personalizado',
 *   description: 'Descripción detallada del evento',
 *   metadata: { customField: 'value' }
 * }, subscriptionEventRepository);
 * ```
 */
export async function registerSubscriptionEvent(
  options: CreateSubscriptionEventOptions,
  repository: ISubscriptionEventRepository,
): Promise<SubscriptionEvent> {
  const event = createSubscriptionEvent(options);
  return await repository.save(event);
}

