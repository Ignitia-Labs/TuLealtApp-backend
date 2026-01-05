import { ApiProperty } from '@nestjs/swagger';
import { GetBillingCycleResponse } from '../get-billing-cycle/get-billing-cycle.response';

/**
 * DTO de response para obtener múltiples ciclos de facturación
 */
export class GetBillingCyclesResponse {
  @ApiProperty({
    description: 'Lista de ciclos de facturación',
    type: GetBillingCycleResponse,
    isArray: true,
    example: [
      {
        id: 1,
        subscriptionId: 1,
        partnerId: 1,
        cycleNumber: 1,
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.999Z',
        durationDays: 31,
        billingDate: '2024-02-01T00:00:00.000Z',
        dueDate: '2024-02-08T23:59:59.999Z',
        amount: 99.99,
        paidAmount: 0,
        totalAmount: 89.99,
        currency: 'USD',
        status: 'pending',
        paymentStatus: 'pending',
        paymentDate: null,
        paymentMethod: null,
        invoiceId: null,
        invoiceNumber: null,
        invoiceStatus: null,
        discountApplied: 10.0,
        createdAt: '2024-02-01T10:30:00.000Z',
        updatedAt: '2024-02-01T10:30:00.000Z',
      },
    ],
  })
  billingCycles: GetBillingCycleResponse[];

  @ApiProperty({
    description: 'Total de ciclos encontrados',
    example: 1,
    type: Number,
  })
  total: number;

  constructor(billingCycles: GetBillingCycleResponse[], total: number) {
    this.billingCycles = billingCycles;
    this.total = total;
  }
}
