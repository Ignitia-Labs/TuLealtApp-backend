import { Injectable, Inject } from '@nestjs/common';
import {
  ISubscriptionEventRepository,
  SubscriptionEvent,
  SubscriptionEventType,
  PartnerSubscription,
} from '@libs/domain';

/**
 * Helper para crear y registrar eventos de suscripción automáticamente
 */
@Injectable()
export class SubscriptionEventHelper {
  constructor(
    @Inject('ISubscriptionEventRepository')
    private readonly subscriptionEventRepository: ISubscriptionEventRepository,
  ) {}

  /**
   * Crea y registra un evento de suscripción
   */
  async createEvent(
    subscription: PartnerSubscription,
    type: SubscriptionEventType,
    metadata?: Record<string, any>,
    paymentId?: number | null,
    invoiceId?: number | null,
  ): Promise<void> {
    const title = this.getEventTitle(type);
    const description = this.getEventDescription(type, subscription, metadata);

    const event = SubscriptionEvent.create(
      subscription.id,
      subscription.partnerId,
      type,
      title,
      description,
      new Date(),
      paymentId || null,
      invoiceId || null,
      metadata || null,
    );

    await this.subscriptionEventRepository.save(event);
  }

  /**
   * Obtiene el título del evento según su tipo
   */
  private getEventTitle(type: SubscriptionEventType): string {
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
  private getEventDescription(
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
}

