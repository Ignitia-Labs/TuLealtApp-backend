import { Module } from '@nestjs/common';
import { InvoicePdfService } from './invoice-pdf.service';
import { EmailService } from './email.service';
import { PaymentGatewayService } from './payment-gateway.service';
import { StorageModule } from '../storage/storage.module';

/**
 * Módulo de servicios de infraestructura
 * Proporciona servicios para PDFs, emails, gateway de pagos, etc.
 */
@Module({
  imports: [StorageModule],
  providers: [InvoicePdfService, EmailService, PaymentGatewayService],
  exports: [InvoicePdfService, EmailService, PaymentGatewayService],
})
export class ServicesModule {}
