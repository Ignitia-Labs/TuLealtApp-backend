import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import {
  UpdateRecipientStatusHandler,
  UpdateRecipientStatusRequest,
  UpdateRecipientStatusResponse,
} from '@libs/application';
import { BadRequestErrorResponseDto, NotFoundErrorResponseDto } from '@libs/shared';

/**
 * Controlador de Webhooks para servicios externos de comunicación
 * Permite que servicios como SendGrid, Twilio, WhatsApp Business, etc.
 * notifiquen cambios en el estado de entrega de mensajes
 */
@ApiTags('Communication Webhooks')
@Controller('communication/webhooks')
export class CommunicationWebhooksController {
  constructor(private readonly updateRecipientStatusHandler: UpdateRecipientStatusHandler) {}

  /**
   * Webhook para servicios de email (SendGrid, AWS SES, etc.)
   */
  @Post('email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook para actualizaciones de estado de email',
    description: 'Endpoint para recibir actualizaciones de estado de servicios de email externos',
  })
  @ApiHeader({
    name: 'X-Webhook-Signature',
    description: 'Firma del webhook para verificación (opcional)',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Webhook procesado exitosamente' })
  @ApiResponse({ status: 400, type: BadRequestErrorResponseDto })
  async handleEmailWebhook(
    @Body() payload: any,
    @Headers('x-webhook-signature') signature?: string,
  ): Promise<{ success: boolean }> {
    // Validar firma del webhook si está configurada
    // TODO: Implementar validación de firma según el proveedor

    // Parsear el payload según el formato del proveedor
    // Ejemplo para SendGrid:
    // {
    //   "messageId": 1,
    //   "partnerId": 1,
    //   "event": "delivered", // "delivered", "opened", "bounced", "failed"
    //   "timestamp": "2024-11-20T09:31:30.000Z",
    //   "reason": null
    // }

    const { messageId, partnerId, event, timestamp, reason } = payload;

    if (!messageId || !partnerId || !event) {
      throw new BadRequestException('Missing required fields: messageId, partnerId, event');
    }

    // Mapear eventos del proveedor a estados del sistema
    let status: 'sent' | 'delivered' | 'read' | 'failed';
    let deliveredAt: string | undefined;
    let readAt: string | undefined;
    let failureReason: string | null = null;

    switch (event.toLowerCase()) {
      case 'delivered':
        status = 'delivered';
        deliveredAt = timestamp;
        break;
      case 'opened':
      case 'read':
        status = 'read';
        readAt = timestamp;
        deliveredAt = timestamp; // Si se abrió, también se entregó
        break;
      case 'bounced':
      case 'failed':
      case 'dropped':
        status = 'failed';
        failureReason = reason || `Email ${event}`;
        break;
      case 'sent':
        status = 'sent';
        break;
      default:
        // Evento desconocido, ignorar o loggear
        return { success: true };
    }

    const request = new UpdateRecipientStatusRequest();
    request.status = status;
    if (deliveredAt) request.deliveredAt = deliveredAt;
    if (readAt) request.readAt = readAt;
    if (failureReason) request.failureReason = failureReason;

    await this.updateRecipientStatusHandler.execute(
      parseInt(messageId, 10),
      parseInt(partnerId, 10),
      request,
    );

    return { success: true };
  }

  /**
   * Webhook para WhatsApp Business API
   */
  @Post('whatsapp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook para actualizaciones de estado de WhatsApp',
    description: 'Endpoint para recibir actualizaciones de estado de WhatsApp Business API',
  })
  @ApiHeader({
    name: 'X-Hub-Signature-256',
    description: 'Firma del webhook de WhatsApp (opcional)',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Webhook procesado exitosamente' })
  @ApiResponse({ status: 400, type: BadRequestErrorResponseDto })
  async handleWhatsAppWebhook(
    @Body() payload: any,
    @Headers('x-hub-signature-256') signature?: string,
  ): Promise<{ success: boolean }> {
    // Validar firma del webhook si está configurada
    // TODO: Implementar validación de firma según WhatsApp Business API

    // Parsear el payload según el formato de WhatsApp Business API
    // Ejemplo:
    // {
    //   "entry": [{
    //     "changes": [{
    //       "value": {
    //         "statuses": [{
    //           "id": "wamid.xxx",
    //           "status": "delivered",
    //           "timestamp": "1234567890",
    //           "recipient_id": "1234567890"
    //         }]
    //       }
    //     }]
    //   }]
    // }

    // Extraer información del payload de WhatsApp
    // Esto es un ejemplo simplificado, la estructura real puede variar
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const statuses = change?.value?.statuses;

    if (!statuses || statuses.length === 0) {
      // Puede ser un webhook de verificación o otro tipo
      return { success: true };
    }

    for (const statusUpdate of statuses) {
      // Necesitarías mapear el recipient_id de WhatsApp al partnerId
      // y el id del mensaje al messageId
      // Esto requiere almacenar el mapeo cuando se envía el mensaje
      // Por ahora, retornamos éxito sin procesar
      // TODO: Implementar mapeo de WhatsApp message ID a messageId/partnerId
    }

    return { success: true };
  }

  /**
   * Webhook para servicios de SMS (Twilio, etc.)
   */
  @Post('sms')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook para actualizaciones de estado de SMS',
    description: 'Endpoint para recibir actualizaciones de estado de servicios de SMS externos',
  })
  @ApiHeader({
    name: 'X-Twilio-Signature',
    description: 'Firma del webhook de Twilio (opcional)',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Webhook procesado exitosamente' })
  @ApiResponse({ status: 400, type: BadRequestErrorResponseDto })
  async handleSmsWebhook(
    @Body() payload: any,
    @Headers('x-twilio-signature') signature?: string,
  ): Promise<{ success: boolean }> {
    // Validar firma del webhook si está configurada
    // TODO: Implementar validación de firma según Twilio

    // Parsear el payload según el formato de Twilio
    // Ejemplo:
    // {
    //   "MessageSid": "SMxxx",
    //   "MessageStatus": "delivered", // "queued", "sent", "delivered", "failed", "undelivered"
    //   "To": "+1234567890",
    //   "From": "+0987654321",
    //   "Timestamp": "2024-11-20T09:31:30.000Z"
    // }

    const { MessageSid, MessageStatus, To, Timestamp, ErrorMessage } = payload;

    if (!MessageSid || !MessageStatus) {
      throw new BadRequestException('Missing required fields: MessageSid, MessageStatus');
    }

    // Necesitarías mapear el MessageSid de Twilio al messageId/partnerId
    // Esto requiere almacenar el mapeo cuando se envía el mensaje

    // Por ahora, retornamos éxito sin procesar
    // TODO: Implementar mapeo de Twilio MessageSid a messageId/partnerId

    return { success: true };
  }
}
