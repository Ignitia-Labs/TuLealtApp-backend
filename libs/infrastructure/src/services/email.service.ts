import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Invoice, Tenant } from '@libs/domain';

/**
 * Opciones para enviar email
 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Servicio para enviar emails con soporte para SMTP con SSL/TLS
 * Soporta tanto desarrollo (GreenMail) como producción (Hostinger)
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private readonly isDevelopment: boolean;
  private readonly smtpConfig: {
    host: string;
    port: number;
    secure: boolean;
    auth?: { user: string; pass: string };
    tls?: { rejectUnauthorized: boolean };
  };

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.smtpConfig = this.buildSmtpConfig();
    this.validateConfiguration();
    this.transporter = this.createTransporter();
    this.logConfiguration();
  }

  /**
   * Construye la configuración SMTP con detección automática de entorno
   */
  private buildSmtpConfig(): {
    host: string;
    port: number;
    secure: boolean;
    auth?: { user: string; pass: string };
    tls?: { rejectUnauthorized: boolean };
  } {
    const host = process.env.SMTP_HOST || 'localhost';
    const port = parseInt(process.env.SMTP_PORT || '1025', 10);
    const isPort465 = port === 465;
    const isPort3465 = port === 3465; // GreenMail SSL port
    const isGreenMail = host.includes('greenmail') || (host === 'localhost' && isPort3465);

    // Detectar si debemos usar SSL
    // Puerto 465 (Hostinger) y 3465 (GreenMail) SIEMPRE requieren SSL directo
    let secure = false;
    if (isPort465 || isPort3465) {
      secure = true; // Forzar SSL para puertos que lo requieren
    } else {
      secure = process.env.SMTP_SECURE === 'true';
    }

    // Configurar autenticación si está disponible
    const auth =
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined;

    // En desarrollo con GreenMail, aceptar certificados autofirmados
    const tls =
      this.isDevelopment && isGreenMail
        ? { rejectUnauthorized: false }
        : undefined;

    return {
      host,
      port,
      secure,
      auth,
      tls,
    };
  }

  /**
   * Valida que la configuración SMTP sea correcta
   */
  private validateConfiguration(): void {
    if (!this.smtpConfig.host) {
      throw new Error('SMTP_HOST no está configurado');
    }

    if (!this.smtpConfig.port || isNaN(this.smtpConfig.port)) {
      throw new Error('SMTP_PORT no está configurado o es inválido');
    }

    // En producción, validar que existan credenciales
    if (!this.isDevelopment && !this.smtpConfig.auth) {
      this.logger.warn(
        'SMTP_USER y SMTP_PASSWORD no están configurados. Algunos servidores SMTP pueden requerir autenticación.',
      );
    }

    // Validar formato de email remitente
    const fromEmail = process.env.SMTP_FROM || 'noreply@tulealtapp.com';
    if (!this.isValidEmail(fromEmail)) {
      this.logger.warn(`SMTP_FROM tiene un formato de email inválido: ${fromEmail}`);
    }
  }

  /**
   * Crea el transporter de nodemailer con la configuración
   */
  private createTransporter(): nodemailer.Transporter {
    // Usar tipo específico para opciones SMTP que incluye host, port, secure, ignoreTLS, etc.
    const config: {
      host: string;
      port: number;
      secure: boolean;
      auth?: { user: string; pass: string };
      tls?: { rejectUnauthorized: boolean };
      ignoreTLS?: boolean;
    } = {
      host: this.smtpConfig.host,
      port: this.smtpConfig.port,
      secure: this.smtpConfig.secure,
      auth: this.smtpConfig.auth,
      ...(this.smtpConfig.tls && { tls: this.smtpConfig.tls }),
    };

    // En desarrollo, solo ignorar TLS si NO estamos usando SSL (puertos 465/3465)
    if (this.isDevelopment && !this.smtpConfig.secure) {
      config.ignoreTLS = true;
    }

    return nodemailer.createTransport(config);
  }

  /**
   * Registra la configuración SMTP usada (sin exponer contraseñas)
   */
  private logConfiguration(): void {
    const configInfo = {
      host: this.smtpConfig.host,
      port: this.smtpConfig.port,
      secure: this.smtpConfig.secure,
      hasAuth: !!this.smtpConfig.auth,
      environment: this.isDevelopment ? 'development' : 'production',
    };

    this.logger.log(`EmailService initialized with config: ${JSON.stringify(configInfo)}`);

    if (this.isDevelopment) {
      this.logger.log(
        `📧 Modo desarrollo: Los emails se enviarán a GreenMail. Accede a http://localhost:8080 para verlos.`,
      );
    }
  }

  /**
   * Valida si un string es un email válido
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Envía un email cuando se genera una factura
   */
  async sendInvoiceGeneratedEmail(
    invoice: Invoice,
    partnerEmail: string,
    pdfUrl?: string,
  ): Promise<void> {
    try {
      const subject = `Nueva factura generada: ${invoice.invoiceNumber}`;
      const html = this.generateInvoiceEmailTemplate(invoice, pdfUrl);

      await this.sendEmail({
        to: partnerEmail,
        subject,
        html,
      });

      this.logger.log(
        `Email de factura enviado a ${partnerEmail} para factura ${invoice.invoiceNumber}`,
      );
    } catch (error) {
      this.logger.error(`Error al enviar email de factura:`, error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Envía un email cuando una factura está por vencer
   */
  async sendInvoiceDueSoonEmail(
    invoice: Invoice,
    partnerEmail: string,
    daysUntilDue: number,
  ): Promise<void> {
    try {
      const subject = `Recordatorio: Factura ${invoice.invoiceNumber} vence en ${daysUntilDue} día(s)`;
      const html = this.generateInvoiceDueSoonEmailTemplate(invoice, daysUntilDue);

      await this.sendEmail({
        to: partnerEmail,
        subject,
        html,
      });

      this.logger.log(
        `Email de recordatorio enviado a ${partnerEmail} para factura ${invoice.invoiceNumber}`,
      );
    } catch (error) {
      this.logger.error(`Error al enviar email de recordatorio:`, error);
    }
  }

  /**
   * Envía un email cuando se recibe un pago
   */
  async sendPaymentReceivedEmail(
    invoice: Invoice,
    partnerEmail: string,
    paymentAmount: number,
    paymentMethod: string,
  ): Promise<void> {
    try {
      const subject = `Pago recibido: Factura ${invoice.invoiceNumber}`;
      const html = this.generatePaymentReceivedEmailTemplate(invoice, paymentAmount, paymentMethod);

      await this.sendEmail({
        to: partnerEmail,
        subject,
        html,
      });

      this.logger.log(
        `Email de pago recibido enviado a ${partnerEmail} para factura ${invoice.invoiceNumber}`,
      );
    } catch (error) {
      this.logger.error(`Error al enviar email de pago recibido:`, error);
    }
  }

  /**
   * Envía un email genérico
   */
  private async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: options.from || process.env.SMTP_FROM || 'noreply@tulealtapp.com',
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        ...(options.cc && {
          cc: Array.isArray(options.cc) ? options.cc.join(', ') : options.cc,
        }),
        ...(options.bcc && {
          bcc: Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc,
        }),
      };

      // Validar emails antes de enviar
      const recipients = [
        ...(Array.isArray(options.to) ? options.to : [options.to]),
        ...(options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : []),
        ...(options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : []),
      ];

      for (const email of recipients) {
        if (!this.isValidEmail(email)) {
          throw new Error(`Email inválido: ${email}`);
        }
      }

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.debug(`Email enviado exitosamente: ${info.messageId}`);
      this.logger.debug(`Destinatarios: ${mailOptions.to}`);
    } catch (error) {
      this.logger.error(`Error al enviar email:`, error);
      // Re-lanzar el error para que el llamador pueda manejarlo
      throw error;
    }
  }

  /**
   * Envía un email genérico (método público)
   * Soporta múltiples destinatarios, CC y BCC
   */
  async sendGenericEmail(options: SendEmailOptions): Promise<void> {
    await this.sendEmail(options);
  }

  /**
   * Verifica la conexión SMTP (útil para diagnóstico)
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Conexión SMTP verificada correctamente');
      return true;
    } catch (error) {
      this.logger.error('Error al verificar conexión SMTP:', error);
      return false;
    }
  }

  /**
   * Envía un email de invitación con magic link para registro
   */
  async sendInvitationEmail(
    recipientEmail: string,
    invitationCode: string,
    magicLink: string,
    tenant: Tenant,
    customMessage?: string,
  ): Promise<void> {
    try {
      const subject = `¡Te han invitado a unirte a ${tenant.name}!`;
      const html = this.generateInvitationEmailTemplate(
        invitationCode,
        magicLink,
        tenant,
        customMessage,
      );

      await this.sendEmail({
        to: recipientEmail,
        subject,
        html,
      });

      this.logger.log(
        `Email de invitación enviado a ${recipientEmail} para código ${invitationCode} del tenant ${tenant.name}`,
      );
    } catch (error) {
      this.logger.error(`Error al enviar email de invitación:`, error);
      // Lanzar error para que el handler pueda decidir si fallar o continuar
      throw error;
    }
  }

  /**
   * Genera el template HTML para email de factura generada
   */
  private generateInvoiceEmailTemplate(invoice: Invoice, pdfUrl?: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .invoice-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nueva Factura Generada</h1>
            </div>
            <div class="content">
              <p>Estimado/a,</p>
              <p>Se ha generado una nueva factura para su suscripción.</p>
              <div class="invoice-details">
                <h3>Detalles de la Factura</h3>
                <p><strong>Número:</strong> ${invoice.invoiceNumber}</p>
                <p><strong>Fecha de emisión:</strong> ${this.formatDate(invoice.issueDate)}</p>
                <p><strong>Fecha de vencimiento:</strong> ${this.formatDate(invoice.dueDate)}</p>
                <p><strong>Total:</strong> ${this.formatCurrency(invoice.total, invoice.currency)}</p>
                <p><strong>Estado:</strong> ${this.translateStatus(invoice.status)}</p>
              </div>
              ${pdfUrl ? `<a href="${pdfUrl}" class="button">Descargar PDF</a>` : ''}
              <p>Por favor, realice el pago antes de la fecha de vencimiento.</p>
            </div>
            <div class="footer">
              <p>Este es un email automático, por favor no responder.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Genera el template HTML para email de factura por vencer
   */
  private generateInvoiceDueSoonEmailTemplate(invoice: Invoice, daysUntilDue: number): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .warning { background-color: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #FF9800; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Recordatorio de Pago</h1>
            </div>
            <div class="content">
              <p>Estimado/a,</p>
              <div class="warning">
                <p><strong>Su factura ${invoice.invoiceNumber} vence en ${daysUntilDue} día(s).</strong></p>
              </div>
              <p>Por favor, realice el pago antes del ${this.formatDate(invoice.dueDate)} para evitar interrupciones en su servicio.</p>
              <p><strong>Monto a pagar:</strong> ${this.formatCurrency(invoice.total, invoice.currency)}</p>
            </div>
            <div class="footer">
              <p>Este es un email automático, por favor no responder.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Genera el template HTML para email de pago recibido
   */
  private generatePaymentReceivedEmailTemplate(
    invoice: Invoice,
    paymentAmount: number,
    paymentMethod: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .success { background-color: #d4edda; padding: 15px; margin: 20px 0; border-left: 4px solid #4CAF50; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Pago Recibido</h1>
            </div>
            <div class="content">
              <p>Estimado/a,</p>
              <div class="success">
                <p><strong>¡Gracias! Hemos recibido su pago.</strong></p>
              </div>
              <p><strong>Factura:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Monto pagado:</strong> ${this.formatCurrency(paymentAmount, invoice.currency)}</p>
              <p><strong>Método de pago:</strong> ${this.translatePaymentMethod(paymentMethod)}</p>
              <p>Su factura ha sido marcada como pagada.</p>
            </div>
            <div class="footer">
              <p>Este es un email automático, por favor no responder.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  }

  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  }

  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      pending: 'Pendiente',
      paid: 'Pagada',
      overdue: 'Vencida',
      cancelled: 'Cancelada',
    };
    return translations[status] || status;
  }

  private translatePaymentMethod(method: string): string {
    const translations: Record<string, string> = {
      credit_card: 'Tarjeta de crédito',
      bank_transfer: 'Transferencia bancaria',
      cash: 'Efectivo',
      other: 'Otro',
    };
    return translations[method] || method;
  }

  /**
   * Genera el template HTML para email de invitación
   */
  private generateInvitationEmailTemplate(
    invitationCode: string,
    magicLink: string,
    tenant: Tenant,
    customMessage?: string,
  ): string {
    const expiresAtText = tenant.pointsExpireDays
      ? `Este código expira en ${tenant.pointsExpireDays} días.`
      : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 0;
              background-color: #ffffff;
            }
            .header {
              background-color: ${tenant.primaryColor || '#4CAF50'};
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 30px 20px;
              background-color: #ffffff;
            }
            .tenant-info {
              text-align: center;
              margin-bottom: 30px;
            }
            ${tenant.logo ? `.tenant-logo { max-width: 150px; height: auto; margin-bottom: 15px; }` : ''}
            .tenant-name {
              font-size: 22px;
              font-weight: bold;
              color: ${tenant.primaryColor || '#4CAF50'};
              margin-bottom: 10px;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .button {
              display: inline-block;
              padding: 15px 40px;
              background-color: ${tenant.primaryColor || '#4CAF50'};
              color: white;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              font-size: 16px;
              transition: background-color 0.3s;
            }
            .button:hover {
              background-color: ${tenant.secondaryColor || '#45a049'};
            }
            .code-box {
              background-color: #e8f5e9;
              padding: 20px;
              margin: 25px 0;
              border-radius: 5px;
              text-align: center;
              border: 2px dashed ${tenant.primaryColor || '#4CAF50'};
            }
            .code-text {
              font-family: 'Courier New', monospace;
              font-size: 20px;
              font-weight: bold;
              color: #2e7d32;
              letter-spacing: 2px;
            }
            .custom-message {
              background-color: #fff3cd;
              padding: 15px;
              margin: 20px 0;
              border-left: 4px solid #ffc107;
              border-radius: 4px;
              font-style: italic;
            }
            .instructions {
              background-color: #f9f9f9;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .instructions ol {
              margin: 10px 0;
              padding-left: 20px;
            }
            .instructions li {
              margin: 8px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 12px;
              background-color: #f9f9f9;
              border-top: 1px solid #e0e0e0;
            }
            @media only screen and (max-width: 600px) {
              .container {
                width: 100% !important;
              }
              .header h1 {
                font-size: 20px;
              }
              .button {
                padding: 12px 30px;
                font-size: 14px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Te han invitado!</h1>
            </div>
            <div class="content">
              <div class="tenant-info">
                ${tenant.logo ? `<img src="${tenant.logo}" alt="${this.escapeHtml(tenant.name)}" class="tenant-logo" />` : ''}
                <div class="tenant-name">${this.escapeHtml(tenant.name)}</div>
                ${tenant.description ? `<p style="color: #666; margin-top: 10px;">${this.escapeHtml(tenant.description)}</p>` : ''}
              </div>

              <p>Hola,</p>
              <p>Has sido invitado a formar parte del programa de lealtad de <strong>${this.escapeHtml(tenant.name)}</strong>.</p>

              ${customMessage ? `<div class="custom-message"><p>${this.escapeHtml(customMessage)}</p></div>` : ''}

              <p>Haz clic en el botón siguiente para registrarte y comenzar a ganar puntos:</p>

              <div class="button-container">
                <a href="${magicLink}" class="button">Registrarme Ahora</a>
              </div>

              <p style="text-align: center; color: #666; margin-top: 20px;">O copia y pega este código en la página de registro:</p>

              <div class="code-box">
                <div class="code-text">${invitationCode}</div>
              </div>

              <div class="instructions">
                <p><strong>Instrucciones:</strong></p>
                <ol>
                  <li>Haz clic en el botón "Registrarme Ahora" o copia el código de arriba</li>
                  <li>Completa el formulario de registro con tus datos</li>
                  <li>¡Comienza a ganar puntos y disfrutar de beneficios exclusivos!</li>
                </ol>
              </div>

              ${expiresAtText ? `<p style="color: #666; font-size: 14px;"><em>${expiresAtText}</em></p>` : ''}

              <p>¡Esperamos verte pronto!</p>
              <p>El equipo de ${this.escapeHtml(tenant.name)}</p>
            </div>
            <div class="footer">
              <p>Este es un email automático. Por favor no responda a este mensaje.</p>
              <p><strong>TuLealtApp</strong> - Sistema de Lealtad</p>
            </div>
          </div>
        </body>
      </html>
    `;
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
}
