import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IInvoiceRepository, IPartnerRepository, Invoice } from '@libs/domain';
import { EmailService } from '@libs/infrastructure';

/**
 * Servicio para enviar recordatorios de facturas vencidas o por vencer
 * Se ejecuta diariamente mediante un cron job
 */
@Injectable()
export class InvoiceReminderService {
  private readonly logger = new Logger(InvoiceReminderService.name);

  constructor(
    @Inject('IInvoiceRepository')
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Cron job que se ejecuta diariamente a las 9:00 AM
   * Revisa facturas pendientes y envía recordatorios
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleDailyInvoiceReminders() {
    this.logger.log('Iniciando envío de recordatorios de facturas...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Buscar facturas pendientes de todos los partners
      // Nota: Esto podría optimizarse con paginación si hay muchos partners
      const allPartners = await this.partnerRepository.findAll();

      let remindersSent = 0;
      let errors = 0;

      for (const partner of allPartners) {
        try {
          // Obtener facturas pendientes del partner
          const pendingInvoices = await this.invoiceRepository.findPendingByPartnerId(partner.id);

          for (const invoice of pendingInvoices) {
            const daysUntilDue = Math.ceil(
              (invoice.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
            );

            // Enviar recordatorio si:
            // - La factura vence en 3 días o menos
            // - La factura ya está vencida
            if (daysUntilDue <= 3) {
              try {
                await this.emailService.sendInvoiceDueSoonEmail(
                  invoice,
                  partner.billingEmail,
                  daysUntilDue,
                );
                remindersSent++;
                this.logger.log(
                  `Recordatorio enviado para factura ${invoice.invoiceNumber} (${daysUntilDue} días restantes)`,
                );
              } catch (error) {
                errors++;
                this.logger.error(
                  `Error al enviar recordatorio para factura ${invoice.invoiceNumber}:`,
                  error,
                );
              }
            }
          }
        } catch (error) {
          errors++;
          this.logger.error(`Error procesando partner ${partner.id}:`, error);
        }
      }

      this.logger.log(
        `Envío de recordatorios completado: ${remindersSent} enviados, ${errors} errores`,
      );
    } catch (error) {
      this.logger.error('Error en envío de recordatorios:', error);
    }
  }

  /**
   * Método manual para enviar recordatorios (útil para testing)
   */
  async sendRemindersManually(): Promise<void> {
    await this.handleDailyInvoiceReminders();
  }
}

