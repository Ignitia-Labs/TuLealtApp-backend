import { ApiProperty } from '@nestjs/swagger';

/**
 * Response para actualizar el estado de un pago
 */
export class UpdatePaymentStatusResponse {
  @ApiProperty({
    description: 'ID del pago',
    example: 123,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Nuevo estado del pago',
    example: 'validated',
    type: String,
  })
  status: string;

  @ApiProperty({
    description: 'Indica si el pago fue validado',
    example: true,
    type: Boolean,
  })
  wasValidated: boolean;

  @ApiProperty({
    description: 'Indica si el pago fue rechazado',
    example: false,
    type: Boolean,
  })
  wasRejected: boolean;

  @ApiProperty({
    description: 'ID del usuario que procesó la actualización',
    example: 5,
    type: Number,
    nullable: true,
  })
  processedBy: number | null;

  @ApiProperty({
    description: 'Fecha de procesamiento',
    example: '2026-02-13T10:30:00.000Z',
    type: Date,
    nullable: true,
  })
  processedAt: Date | null;

  @ApiProperty({
    description: 'Razón del rechazo (solo si fue rechazado)',
    example: null,
    type: String,
    nullable: true,
  })
  rejectionReason: string | null;

  @ApiProperty({
    description: 'Resumen de la aplicación del pago (solo si fue validado)',
    type: Object,
    nullable: true,
  })
  applicationSummary?: {
    invoiceUpdated: boolean;
    invoiceId: number | null;
    billingCycleUpdated: boolean;
    billingCycleId: number | null;
    billingCyclePaid: boolean;
    appliedToOtherCycles: number;
    appliedToInvoices: number;
  };

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'Payment validated and applied successfully',
    type: String,
  })
  message: string;

  constructor(
    id: number,
    status: string,
    wasValidated: boolean,
    wasRejected: boolean,
    processedBy: number | null,
    processedAt: Date | null,
    rejectionReason: string | null,
    message: string,
    applicationSummary?: {
      invoiceUpdated: boolean;
      invoiceId: number | null;
      billingCycleUpdated: boolean;
      billingCycleId: number | null;
      billingCyclePaid: boolean;
      appliedToOtherCycles: number;
      appliedToInvoices: number;
    },
  ) {
    this.id = id;
    this.status = status;
    this.wasValidated = wasValidated;
    this.wasRejected = wasRejected;
    this.processedBy = processedBy;
    this.processedAt = processedAt;
    this.rejectionReason = rejectionReason;
    this.message = message;
    this.applicationSummary = applicationSummary;
  }
}
