import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Invoice } from '@libs/domain';

/**
 * Servicio para enviar emails
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configurar transporter de nodemailer
    // En producción, usar SMTP real o servicio como SendGrid, AWS SES, etc.
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
      // Para desarrollo con MailHog o similar
      ...(process.env.NODE_ENV !== 'production' && {
        ignoreTLS: true,
      }),
    });

    this.logger.log('EmailService initialized');
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
  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }): Promise<void> {
    const mailOptions = {
      from: options.from || process.env.SMTP_FROM || 'noreply@tulealtapp.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await this.transporter.sendMail(mailOptions);
    this.logger.debug(`Email enviado: ${info.messageId}`);
  }

  /**
   * Envía un email genérico (método público)
   */
  async sendGenericEmail(options: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }): Promise<void> {
    await this.sendEmail(options);
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
