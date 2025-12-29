import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Invoice, InvoiceItem } from '@libs/domain';
import { S3Service } from '../storage/s3.service';
import { UploadedFile } from '../storage/types/file.interface';

/**
 * Servicio para generar PDFs de facturas
 */
@Injectable()
export class InvoicePdfService {
  private readonly logger = new Logger(InvoicePdfService.name);

  constructor(private readonly s3Service: S3Service) {}

  /**
   * Genera un PDF de factura y lo sube a S3
   * @param invoice Factura para la cual generar el PDF
   * @returns URL del PDF generado en S3
   */
  async generateAndUploadInvoicePdf(invoice: Invoice): Promise<string> {
    try {
      // Crear documento PDF
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      // Capturar datos del PDF
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {});

      // Generar contenido del PDF
      this.generateInvoiceContent(doc, invoice);

      // Finalizar el documento
      doc.end();

      // Esperar a que el documento termine de generarse
      await new Promise<void>((resolve) => {
        doc.on('end', resolve);
      });

      // Combinar chunks en un buffer
      const pdfBuffer = Buffer.concat(chunks);

      // Subir a S3
      const fileName = `invoice-${invoice.invoiceNumber}.pdf`;
      const folder = 'invoices';

      // Crear un objeto UploadedFile compatible
      const uploadedFile: UploadedFile = {
        fieldname: 'pdf',
        originalname: fileName,
        encoding: 'binary',
        mimetype: 'application/pdf',
        size: pdfBuffer.length,
        buffer: pdfBuffer,
      };

      const pdfUrl = await this.s3Service.uploadFile(
        uploadedFile,
        folder,
        fileName,
      );

      this.logger.log(`PDF generado y subido para factura ${invoice.invoiceNumber}: ${pdfUrl}`);
      return pdfUrl;
    } catch (error) {
      this.logger.error(`Error al generar PDF para factura ${invoice.invoiceNumber}:`, error);
      throw new Error(`Failed to generate invoice PDF: ${error.message}`);
    }
  }

  /**
   * Genera el contenido del PDF de la factura
   */
  private generateInvoiceContent(doc: InstanceType<typeof PDFDocument>, invoice: Invoice): void {
    // Encabezado
    doc
      .fontSize(20)
      .text('FACTURA', { align: 'right' })
      .moveDown();

    doc
      .fontSize(10)
      .text(`Número: ${invoice.invoiceNumber}`, { align: 'right' })
      .text(`Fecha de emisión: ${this.formatDate(invoice.issueDate)}`, { align: 'right' })
      .text(`Fecha de vencimiento: ${this.formatDate(invoice.dueDate)}`, { align: 'right' })
      .moveDown(2);

    // Información del emisor
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('EMISOR', { underline: true })
      .font('Helvetica')
      .fontSize(10)
      .text(invoice.businessName)
      .text(`NIT/RFC: ${invoice.taxId}`)
      .text(invoice.fiscalAddress)
      .text(`Email: ${invoice.billingEmail}`)
      .moveDown(2);

    // Tabla de items
    doc.fontSize(10).font('Helvetica-Bold');
    const tableTop = doc.y;
    const itemHeight = 20;
    const tableWidth = 500;

    // Encabezados de tabla
    doc
      .text('Descripción', 50, tableTop)
      .text('Cant.', 250, tableTop)
      .text('Precio Unit.', 300, tableTop)
      .text('Total', 450, tableTop);

    // Línea separadora
    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    // Items
    let yPosition = tableTop + 25;
    doc.font('Helvetica').fontSize(9);

    invoice.items.forEach((item) => {
      // Descripción (puede ser multilínea)
      const descriptionLines = doc.heightOfString(item.description, {
        width: 180,
      });
      doc.text(item.description, 50, yPosition, { width: 180 });

      // Cantidad
      doc.text(item.quantity.toString(), 250, yPosition);

      // Precio unitario
      doc.text(this.formatCurrency(item.unitPrice, invoice.currency), 300, yPosition);

      // Total del item
      doc.text(this.formatCurrency(item.total, invoice.currency), 450, yPosition);

      yPosition += Math.max(descriptionLines, itemHeight);
    });

    // Totales
    yPosition += 10;
    doc
      .moveTo(50, yPosition)
      .lineTo(550, yPosition)
      .stroke();

    yPosition += 15;

    // Subtotal
    doc
      .font('Helvetica-Bold')
      .text('Subtotal:', 400, yPosition)
      .font('Helvetica')
      .text(this.formatCurrency(invoice.subtotal, invoice.currency), 450, yPosition);

    yPosition += 15;

    // Descuento
    if (invoice.discountAmount > 0) {
      doc
        .font('Helvetica-Bold')
        .text('Descuento:', 400, yPosition)
        .font('Helvetica')
        .text(`-${this.formatCurrency(invoice.discountAmount, invoice.currency)}`, 450, yPosition);
      yPosition += 15;
    }

    // Impuestos
    if (invoice.taxAmount > 0) {
      doc
        .font('Helvetica-Bold')
        .text('Impuestos:', 400, yPosition)
        .font('Helvetica')
        .text(this.formatCurrency(invoice.taxAmount, invoice.currency), 450, yPosition);
      yPosition += 15;
    }

    // Créditos aplicados
    if (invoice.creditApplied > 0) {
      doc
        .font('Helvetica-Bold')
        .text('Créditos aplicados:', 400, yPosition)
        .font('Helvetica')
        .text(`-${this.formatCurrency(invoice.creditApplied, invoice.currency)}`, 450, yPosition);
      yPosition += 15;
    }

    // Total
    yPosition += 5;
    doc
      .moveTo(50, yPosition)
      .lineTo(550, yPosition)
      .stroke();

    yPosition += 15;
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('TOTAL:', 400, yPosition)
      .text(this.formatCurrency(invoice.total, invoice.currency), 450, yPosition);

    // Estado
    yPosition += 30;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(`Estado: ${this.translateStatus(invoice.status)}`, 50, yPosition)
      .font('Helvetica')
      .text(`Estado de pago: ${this.translatePaymentStatus(invoice.paymentStatus)}`, 50, yPosition + 15);

    // Notas
    if (invoice.notes) {
      yPosition += 40;
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Notas:', 50, yPosition)
        .font('Helvetica')
        .text(invoice.notes, 50, yPosition + 15, { width: 500 });
    }

    // Pie de página
    const pageHeight = doc.page.height;
    doc
      .fontSize(8)
      .font('Helvetica')
      .text(
        `Factura generada el ${this.formatDate(new Date())}`,
        50,
        pageHeight - 50,
        { align: 'center' },
      );
  }

  /**
   * Formatea una fecha para mostrar en el PDF
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  }

  /**
   * Formatea un monto como moneda
   */
  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  }

  /**
   * Traduce el estado de la factura al español
   */
  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      pending: 'Pendiente',
      paid: 'Pagada',
      overdue: 'Vencida',
      cancelled: 'Cancelada',
    };
    return translations[status] || status;
  }

  /**
   * Traduce el estado de pago al español
   */
  private translatePaymentStatus(status: string): string {
    const translations: Record<string, string> = {
      pending: 'Pendiente',
      paid: 'Pagado',
      failed: 'Fallido',
      refunded: 'Reembolsado',
    };
    return translations[status] || status;
  }
}

