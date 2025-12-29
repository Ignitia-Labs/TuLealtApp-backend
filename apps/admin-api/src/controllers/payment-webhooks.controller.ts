import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { PaymentGatewayService } from '@libs/infrastructure';
import { CreatePaymentHandler } from '@libs/application';

/**
 * Controlador de webhooks de pagos para Admin API
 * Recibe notificaciones de gateways de pago (Stripe, PayPal, etc.)
 *
 * Endpoints:
 * - POST /admin/payment-webhooks/stripe - Webhook de Stripe
 */
@ApiTags('Payment Webhooks')
@Controller('payment-webhooks')
export class PaymentWebhooksController {
  private readonly logger = new Logger(PaymentWebhooksController.name);

  constructor(
    private readonly paymentGatewayService: PaymentGatewayService,
    private readonly createPaymentHandler: CreatePaymentHandler,
  ) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook de Stripe',
    description:
      'Endpoint para recibir webhooks de Stripe. Procesa eventos de pagos y actualiza el estado de las facturas y ciclos de facturación.',
  })
  @ApiHeader({
    name: 'stripe-signature',
    description: 'Firma del webhook de Stripe',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook procesado exitosamente',
    example: {
      received: true,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error al procesar el webhook',
    example: {
      statusCode: 400,
      message: 'Invalid webhook signature',
      error: 'Bad Request',
    },
  })
  async handleStripeWebhook(
    @Body() payload: any,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    try {
      if (!this.paymentGatewayService.isConfigured()) {
        this.logger.warn('Stripe no está configurado. Ignorando webhook.');
        return { received: false };
      }

      // Procesar el webhook
      const event = await this.paymentGatewayService.handleWebhook(
        JSON.stringify(payload),
        signature,
      );

      // Procesar diferentes tipos de eventos
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as any);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as any);
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as any);
          break;

        default:
          this.logger.log(`Evento no manejado: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Error procesando webhook de Stripe:', error);
      throw error;
    }
  }

  /**
   * Maneja un PaymentIntent exitoso
   */
  private async handlePaymentIntentSucceeded(paymentIntent: any): Promise<void> {
    this.logger.log(`PaymentIntent exitoso: ${paymentIntent.id}`);

    // Extraer metadata para obtener invoiceId y otros datos
    const metadata = paymentIntent.metadata || {};
    const invoiceId = metadata.invoiceId ? parseInt(metadata.invoiceId, 10) : null;
    const subscriptionId = metadata.subscriptionId
      ? parseInt(metadata.subscriptionId, 10)
      : null;
    const billingCycleId = metadata.billingCycleId
      ? parseInt(metadata.billingCycleId, 10)
      : null;

    if (!subscriptionId) {
      this.logger.warn('PaymentIntent sin subscriptionId en metadata');
      return;
    }

    // Crear registro de pago
    try {
      const paymentRequest = {
        subscriptionId,
        invoiceId: invoiceId || undefined,
        billingCycleId: billingCycleId || undefined,
        amount: paymentIntent.amount / 100, // Convertir de centavos
        currency: paymentIntent.currency.toUpperCase(),
        paymentMethod: 'credit_card',
        status: 'paid' as const,
        gateway: 'stripe',
        gatewayTransactionId: paymentIntent.id,
        transactionId: paymentIntent.id,
        cardLastFour: paymentIntent.payment_method_details?.card?.last4 || null,
        cardBrand: paymentIntent.payment_method_details?.card?.brand || null,
        cardExpiry: paymentIntent.payment_method_details?.card?.exp_month
          ? `${paymentIntent.payment_method_details.card.exp_month}/${paymentIntent.payment_method_details.card.exp_year}`
          : null,
      };

      await this.createPaymentHandler.execute(paymentRequest as any);
      this.logger.log(`Pago registrado exitosamente para PaymentIntent ${paymentIntent.id}`);
    } catch (error) {
      this.logger.error(`Error al registrar pago para PaymentIntent ${paymentIntent.id}:`, error);
    }
  }

  /**
   * Maneja un PaymentIntent fallido
   */
  private async handlePaymentIntentFailed(paymentIntent: any): Promise<void> {
    this.logger.log(`PaymentIntent fallido: ${paymentIntent.id}`);

    // Aquí se podría implementar lógica para:
    // - Registrar el intento fallido
    // - Enviar notificación al partner
    // - Incrementar contador de reintentos
  }

  /**
   * Maneja un reembolso
   */
  private async handleChargeRefunded(charge: any): Promise<void> {
    this.logger.log(`Reembolso procesado: ${charge.id}`);

    // Aquí se podría implementar lógica para:
    // - Actualizar el estado del pago a 'refunded'
    // - Actualizar la factura y ciclo de facturación
    // - Enviar notificación al partner
  }
}

