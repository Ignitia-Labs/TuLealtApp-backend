import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Invoice } from '@libs/domain';

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
}
