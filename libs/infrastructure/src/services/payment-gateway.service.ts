import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

/**
 * Servicio para integración con gateway de pagos (Stripe)
 * Proporciona métodos para procesar pagos y manejar webhooks
 */
@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private readonly stripe: Stripe;

  constructor() {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      this.logger.warn(
        'STRIPE_SECRET_KEY no configurado. El servicio de pagos no estará disponible.',
      );
      // Crear instancia dummy para evitar errores
      this.stripe = null as any;
    } else {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-12-15.clover',
      });
      this.logger.log('Stripe payment gateway initialized');
    }
  }

  /**
   * Crea un PaymentIntent en Stripe
   * @param amount Monto en centavos (o unidad mínima de la moneda)
   * @param currency Código de moneda (ej: 'usd', 'eur')
   * @param metadata Metadatos adicionales
   * @returns PaymentIntent de Stripe
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.PaymentIntent> {
    if (!this.stripe) {
      throw new Error('Stripe no está configurado. Configure STRIPE_SECRET_KEY.');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convertir a centavos
        currency: currency.toLowerCase(),
        metadata: metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      });

      this.logger.log(`PaymentIntent creado: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error('Error al crear PaymentIntent:', error);
      throw error;
    }
  }

  /**
   * Confirma un PaymentIntent
   * @param paymentIntentId ID del PaymentIntent
   * @returns PaymentIntent confirmado
   */
  async confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    if (!this.stripe) {
      throw new Error('Stripe no está configurado.');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
      this.logger.log(`PaymentIntent confirmado: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error('Error al confirmar PaymentIntent:', error);
      throw error;
    }
  }

  /**
   * Obtiene un PaymentIntent por ID
   * @param paymentIntentId ID del PaymentIntent
   * @returns PaymentIntent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    if (!this.stripe) {
      throw new Error('Stripe no está configurado.');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      this.logger.error('Error al obtener PaymentIntent:', error);
      throw error;
    }
  }

  /**
   * Maneja un webhook de Stripe
   * @param payload Payload del webhook
   * @param signature Firma del webhook
   * @returns Evento de Stripe
   */
  async handleWebhook(payload: string | Buffer, signature: string): Promise<Stripe.Event> {
    if (!this.stripe) {
      throw new Error('Stripe no está configurado.');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET no configurado.');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);

      this.logger.log(`Webhook recibido: ${event.type} (${event.id})`);
      return event;
    } catch (error) {
      this.logger.error('Error al procesar webhook:', error);
      throw error;
    }
  }

  /**
   * Crea un Customer en Stripe
   * @param email Email del cliente
   * @param name Nombre del cliente
   * @param metadata Metadatos adicionales
   * @returns Customer de Stripe
   */
  async createCustomer(
    email: string,
    name: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.Customer> {
    if (!this.stripe) {
      throw new Error('Stripe no está configurado.');
    }

    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: metadata || {},
      });

      this.logger.log(`Customer creado: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error('Error al crear Customer:', error);
      throw error;
    }
  }

  /**
   * Verifica si Stripe está configurado
   */
  isConfigured(): boolean {
    return !!this.stripe && !!process.env.STRIPE_SECRET_KEY;
  }
}
