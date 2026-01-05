import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para una comisión en la respuesta
 */
export class CommissionDto {
  @ApiProperty({
    description: 'ID de la comisión',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID del usuario staff',
    example: 5,
    type: Number,
  })
  staffUserId: number;

  @ApiProperty({
    description: 'Nombre del usuario staff',
    example: 'Juan Pérez',
    type: String,
  })
  staffUserName: string;

  @ApiProperty({
    description: 'Email del usuario staff',
    example: 'juan.perez@example.com',
    type: String,
  })
  staffUserEmail: string;

  @ApiProperty({
    description: 'ID del partner',
    example: 1,
    type: Number,
  })
  partnerId: number;

  @ApiProperty({
    description: 'Nombre del partner',
    example: 'Restaurante La Cocina',
    type: String,
  })
  partnerName: string;

  @ApiProperty({
    description: 'Porcentaje de comisión aplicado',
    example: 15.5,
    type: Number,
  })
  commissionPercent: number;

  @ApiProperty({
    description: 'Monto de la comisión',
    example: 155.5,
    type: Number,
  })
  commissionAmount: number;

  @ApiProperty({
    description: 'Estado de la comisión',
    example: 'pending',
    enum: ['pending', 'paid', 'cancelled'],
  })
  status: 'pending' | 'paid' | 'cancelled';

  @ApiProperty({
    description: 'Fecha de pago de la comisión',
    example: '2024-01-15T00:00:00Z',
    type: Date,
    nullable: true,
  })
  paidDate: Date | null;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-01-01T00:00:00Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Moneda de la comisión',
    example: 'USD',
    type: String,
  })
  currency: string;

  constructor(
    id: number,
    staffUserId: number,
    staffUserName: string,
    staffUserEmail: string,
    partnerId: number,
    partnerName: string,
    commissionPercent: number,
    commissionAmount: number,
    status: 'pending' | 'paid' | 'cancelled',
    paidDate: Date | null,
    createdAt: Date,
    currency: string,
  ) {
    this.id = id;
    this.staffUserId = staffUserId;
    this.staffUserName = staffUserName;
    this.staffUserEmail = staffUserEmail;
    this.partnerId = partnerId;
    this.partnerName = partnerName;
    this.commissionPercent = commissionPercent;
    this.commissionAmount = commissionAmount;
    this.status = status;
    this.paidDate = paidDate;
    this.createdAt = createdAt;
    this.currency = currency;
  }
}

/**
 * Response DTO para obtener comisiones de un pago
 */
export class GetPaymentCommissionsResponse {
  @ApiProperty({
    description: 'ID del pago',
    example: 1,
    type: Number,
  })
  paymentId: number;

  @ApiProperty({
    description: 'Monto total del pago',
    example: 1000.0,
    type: Number,
  })
  paymentAmount: number;

  @ApiProperty({
    description: 'Moneda del pago',
    example: 'USD',
    type: String,
  })
  currency: string;

  @ApiProperty({
    description: 'Fecha del pago',
    example: '2024-01-01T00:00:00Z',
    type: Date,
  })
  paymentDate: Date;

  @ApiProperty({
    description: 'Lista de comisiones',
    type: [CommissionDto],
  })
  commissions: CommissionDto[];

  @ApiProperty({
    description: 'Total de comisiones calculadas',
    example: 155.5,
    type: Number,
  })
  totalCommissions: number;

  constructor(
    paymentId: number,
    paymentAmount: number,
    currency: string,
    paymentDate: Date,
    commissions: CommissionDto[],
  ) {
    this.paymentId = paymentId;
    this.paymentAmount = paymentAmount;
    this.currency = currency;
    this.paymentDate = paymentDate;
    this.commissions = commissions;
    this.totalCommissions = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
  }
}
