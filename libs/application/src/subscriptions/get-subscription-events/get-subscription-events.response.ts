import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionEventType } from '@libs/domain';

export class SubscriptionEventResponse {
  @ApiProperty({ description: 'ID del evento', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID de la suscripción', example: 1 })
  subscriptionId: number;

  @ApiProperty({ description: 'ID del partner', example: 1 })
  partnerId: number;

  @ApiProperty({
    description: 'Tipo de evento',
    enum: [
      'created',
      'activated',
      'suspended',
      'cancelled',
      'renewed',
      'payment_received',
      'payment_failed',
      'plan_changed',
      'paused',
      'resumed',
      'expired',
      'trial_started',
      'trial_ended',
      'custom',
    ],
    example: 'created',
  })
  type: SubscriptionEventType;

  @ApiProperty({ description: 'Título del evento', example: 'Suscripción creada' })
  title: string;

  @ApiProperty({
    description: 'Descripción del evento',
    example: 'Se creó una nueva suscripción para el partner',
  })
  description: string;

  @ApiProperty({ description: 'ID del pago asociado (si aplica)', example: 1, nullable: true })
  paymentId: number | null;

  @ApiProperty({ description: 'ID de la factura asociada (si aplica)', example: 1, nullable: true })
  invoiceId: number | null;

  @ApiProperty({
    description: 'Metadata adicional del evento',
    example: { planType: 'conecta', billingAmount: 79.99 },
    nullable: true,
  })
  metadata: Record<string, any> | null;

  @ApiProperty({
    description: 'Fecha en que ocurrió el evento',
    example: '2024-01-01T00:00:00.000Z',
  })
  occurredAt: Date;

  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  constructor(
    id: number,
    subscriptionId: number,
    partnerId: number,
    type: SubscriptionEventType,
    title: string,
    description: string,
    paymentId: number | null,
    invoiceId: number | null,
    metadata: Record<string, any> | null,
    occurredAt: Date,
    createdAt: Date,
  ) {
    this.id = id;
    this.subscriptionId = subscriptionId;
    this.partnerId = partnerId;
    this.type = type;
    this.title = title;
    this.description = description;
    this.paymentId = paymentId;
    this.invoiceId = invoiceId;
    this.metadata = metadata;
    this.occurredAt = occurredAt;
    this.createdAt = createdAt;
  }
}

export class GetSubscriptionEventsResponse {
  @ApiProperty({
    description: 'Lista de eventos',
    type: [SubscriptionEventResponse],
  })
  events: SubscriptionEventResponse[];

  @ApiProperty({ description: 'Total de eventos', example: 100 })
  total: number;

  @ApiProperty({ description: 'Página actual', example: 1, nullable: true })
  page: number | null;

  @ApiProperty({ description: 'Límite de elementos por página', example: 10, nullable: true })
  limit: number | null;

  constructor(
    events: SubscriptionEventResponse[],
    total: number,
    page: number | null,
    limit: number | null,
  ) {
    this.events = events;
    this.total = total;
    this.page = page;
    this.limit = limit;
  }
}
