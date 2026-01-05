import { Injectable, Inject, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateContactInquiryRequest } from './create-contact-inquiry.request';
import { CreateContactInquiryResponse } from './create-contact-inquiry.response';
import { EmailService } from '@libs/infrastructure';

/**
 * Handler para el caso de uso de crear una consulta de contacto
 */
@Injectable()
export class CreateContactInquiryHandler {
  private readonly logger = new Logger(CreateContactInquiryHandler.name);

  constructor(private readonly emailService: EmailService) {}

  async execute(request: CreateContactInquiryRequest): Promise<CreateContactInquiryResponse> {
    // Generar ID único para la consulta
    const inquiryId = randomUUID();
    const createdAt = new Date();

    // Enviar notificación por email al equipo
    try {
      await this.sendNotificationEmail(request, inquiryId);
    } catch (error) {
      // Log error pero no fallar la creación de la consulta
      this.logger.error('Error al enviar email de notificación:', error);
    }

    // Enviar email de confirmación al usuario
    try {
      await this.sendConfirmationEmail(request);
    } catch (error) {
      // Log error pero no fallar la creación de la consulta
      this.logger.error('Error al enviar email de confirmación:', error);
    }

    return new CreateContactInquiryResponse(
      inquiryId,
      'received',
      'Su consulta ha sido recibida exitosamente. Nos pondremos en contacto pronto.',
      createdAt,
    );
  }

  /**
   * Envía email de notificación al equipo interno
   */
  private async sendNotificationEmail(
    request: CreateContactInquiryRequest,
    inquiryId: string,
  ): Promise<void> {
    const subjectMap: Record<string, string> = {
      general: 'Consulta General',
      demo: 'Solicitud de Demo',
      pricing: 'Información de Precios',
      support: 'Soporte Técnico',
      partnership: 'Alianzas Comerciales',
      other: 'Otra Consulta',
    };

    const subject = subjectMap[request.subject] || 'Nueva Consulta de Contacto';
    const priority =
      request.subject === 'demo' || request.subject === 'pricing' ? 'ALTA' : 'NORMAL';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .inquiry-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #4CAF50; }
            .priority-high { border-left-color: #f44336; }
            .field { margin: 10px 0; }
            .field-label { font-weight: bold; color: #555; }
            .field-value { color: #333; margin-top: 5px; }
            .metadata { background-color: #f5f5f5; padding: 10px; margin-top: 15px; border-radius: 3px; font-size: 12px; color: #666; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nueva Consulta de Contacto</h1>
            </div>
            <div class="content">
              <p><strong>Prioridad:</strong> <span style="color: ${priority === 'ALTA' ? '#f44336' : '#4CAF50'}">${priority}</span></p>
              <div class="inquiry-details ${priority === 'ALTA' ? 'priority-high' : ''}">
                <div class="field">
                  <div class="field-label">ID de Consulta:</div>
                  <div class="field-value">${inquiryId}</div>
                </div>
                <div class="field">
                  <div class="field-label">Tipo de Consulta:</div>
                  <div class="field-value">${subject}</div>
                </div>
                <div class="field">
                  <div class="field-label">Nombre:</div>
                  <div class="field-value">${this.escapeHtml(request.name)}</div>
                </div>
                <div class="field">
                  <div class="field-label">Email:</div>
                  <div class="field-value"><a href="mailto:${this.escapeHtml(request.email)}">${this.escapeHtml(request.email)}</a></div>
                </div>
                ${
                  request.company
                    ? `
                <div class="field">
                  <div class="field-label">Empresa:</div>
                  <div class="field-value">${this.escapeHtml(request.company)}</div>
                </div>
                `
                    : ''
                }
                ${
                  request.phone
                    ? `
                <div class="field">
                  <div class="field-label">Teléfono:</div>
                  <div class="field-value">${this.escapeHtml(request.phone)}</div>
                </div>
                `
                    : ''
                }
                <div class="field">
                  <div class="field-label">Mensaje:</div>
                  <div class="field-value" style="white-space: pre-wrap;">${this.escapeHtml(request.message)}</div>
                </div>
              </div>
              ${
                request.metadata
                  ? `
              <div class="metadata">
                <strong>Metadatos:</strong><br>
                ${request.metadata.userAgent ? `User Agent: ${this.escapeHtml(request.metadata.userAgent)}<br>` : ''}
                ${request.metadata.referrer ? `Referrer: ${this.escapeHtml(request.metadata.referrer)}<br>` : ''}
                ${request.metadata.language ? `Idioma: ${this.escapeHtml(request.metadata.language)}<br>` : ''}
                ${request.metadata.source ? `Fuente: ${this.escapeHtml(request.metadata.source)}<br>` : ''}
              </div>
              `
                  : ''
              }
            </div>
            <div class="footer">
              <p>Este es un email automático generado por el sistema de contacto de TuLealtApp.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Obtener email de destino desde variables de entorno o usar uno por defecto
    const recipientEmail =
      process.env.CONTACT_INQUIRY_EMAIL || process.env.SMTP_FROM || 'contact@ignitialabs.dev';

    // Enviar email usando el método público
    await this.emailService.sendGenericEmail({
      to: recipientEmail,
      subject: `[${priority}] ${subject} - ${request.name}`,
      html: html,
    });
  }

  /**
   * Envía email de confirmación al usuario
   */
  private async sendConfirmationEmail(request: CreateContactInquiryRequest): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .message { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Gracias por contactarnos!</h1>
            </div>
            <div class="content">
              <p>Estimado/a ${this.escapeHtml(request.name)},</p>
              <p>Hemos recibido su consulta y nos pondremos en contacto con usted pronto.</p>
              <div class="message">
                <p><strong>Resumen de su consulta:</strong></p>
                <p>Tipo: ${this.getSubjectLabel(request.subject)}</p>
                ${request.company ? `<p>Empresa: ${this.escapeHtml(request.company)}</p>` : ''}
                <p>Mensaje: ${this.escapeHtml(request.message.substring(0, 200))}${request.message.length > 200 ? '...' : ''}</p>
              </div>
              <p>Nuestro equipo revisará su solicitud y le responderá a la brevedad posible.</p>
            </div>
            <div class="footer">
              <p>Este es un email automático. Por favor no responda a este mensaje.</p>
              <p>TuLealtApp - Sistema de Lealtad</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.emailService.sendGenericEmail({
      to: request.email,
      subject: 'Confirmación de Consulta - TuLealtApp',
      html: html,
    });
  }

  /**
   * Escapa HTML para prevenir XSS
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Obtiene la etiqueta legible del subject
   */
  private getSubjectLabel(subject: string): string {
    const labels: Record<string, string> = {
      general: 'Consulta General',
      demo: 'Solicitud de Demo',
      pricing: 'Información de Precios',
      support: 'Soporte Técnico',
      partnership: 'Alianzas Comerciales',
      other: 'Otra Consulta',
    };
    return labels[subject] || subject;
  }
}
