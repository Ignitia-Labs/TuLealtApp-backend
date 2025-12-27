import { ApiProperty } from '@nestjs/swagger';
import { GetSubscriptionResponse } from '../get-subscription/get-subscription.response';

/**
 * DTO de response para obtener todas las suscripciones
 */
export class GetSubscriptionsResponse {
  @ApiProperty({
    description: 'Lista de suscripciones',
    type: GetSubscriptionResponse,
    isArray: true,
    example: [
      {
        id: 1,
        partnerId: 1,
        planId: 1,
        planSlug: 'conecta',
        planType: 'conecta',
        status: 'active',
        startDate: '2024-01-01T00:00:00.000Z',
        renewalDate: '2025-01-01T00:00:00.000Z',
        billingFrequency: 'monthly',
        billingAmount: 79.99,
        currency: 'USD',
        nextBillingDate: '2024-02-01T00:00:00.000Z',
        nextBillingAmount: 79.99,
        currentPeriodStart: '2024-01-01T00:00:00.000Z',
        currentPeriodEnd: '2024-02-01T00:00:00.000Z',
        trialEndDate: null,
        pausedAt: null,
        pauseReason: null,
        gracePeriodDays: 7,
        retryAttempts: 0,
        maxRetryAttempts: 3,
        creditBalance: 0,
        discountPercent: null,
        discountCode: null,
        lastPaymentDate: null,
        lastPaymentAmount: null,
        paymentStatus: null,
        autoRenew: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ],
  })
  subscriptions: GetSubscriptionResponse[];

  @ApiProperty({
    description: 'Total de suscripciones',
    example: 10,
    type: Number,
  })
  total: number;

  @ApiProperty({
    description: 'Página actual (null si no se aplicó paginación)',
    example: 1,
    type: Number,
    nullable: true,
    required: false,
  })
  page: number | null;

  @ApiProperty({
    description: 'Elementos por página (null si no se aplicó paginación)',
    example: 10,
    type: Number,
    nullable: true,
    required: false,
  })
  limit: number | null;

  constructor(
    subscriptions: GetSubscriptionResponse[],
    total: number,
    page: number | null,
    limit: number | null,
  ) {
    this.subscriptions = subscriptions;
    this.total = total;
    this.page = page;
    this.limit = limit;
  }
}

