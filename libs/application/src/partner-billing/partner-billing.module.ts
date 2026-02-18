import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@libs/infrastructure';

// Handlers
import { GetCurrentBillingCycleHandler } from './get-current-billing-cycle/get-current-billing-cycle.handler';
import { GetPartnerPaymentsHandler } from './get-partner-payments/get-partner-payments.handler';
import { GetPartnerInvoicesHandler } from './get-partner-invoices/get-partner-invoices.handler';
import { GetPartnerSubscriptionHandler } from './get-partner-subscription/get-partner-subscription.handler';
import { CreatePaymentHandler } from '../payments/create-payment/create-payment.handler';
import { CommissionCalculationService } from '../commissions/calculate-commission/commission-calculation.service';

@Module({
  imports: [InfrastructureModule],
  providers: [
    // Handlers
    GetCurrentBillingCycleHandler,
    GetPartnerPaymentsHandler,
    GetPartnerInvoicesHandler,
    GetPartnerSubscriptionHandler,
    CommissionCalculationService,
    CreatePaymentHandler,
  ],
  exports: [
    GetCurrentBillingCycleHandler,
    GetPartnerPaymentsHandler,
    GetPartnerInvoicesHandler,
    GetPartnerSubscriptionHandler,
    CreatePaymentHandler,
  ],
})
export class PartnerBillingModule {}
