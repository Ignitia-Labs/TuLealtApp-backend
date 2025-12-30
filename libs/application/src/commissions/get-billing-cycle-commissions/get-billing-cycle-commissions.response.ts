import { ApiProperty } from '@nestjs/swagger';
import { CommissionDto } from '../get-payment-commissions/get-payment-commissions.response';

/**
 * Response DTO para obtener comisiones de un billing cycle
 */
export class GetBillingCycleCommissionsResponse {
  @ApiProperty({
    description: 'ID del billing cycle',
    example: 1,
    type: Number,
  })
  billingCycleId: number;

  @ApiProperty({
    description: 'Número del ciclo',
    example: 1,
    type: Number,
  })
  cycleNumber: number;

  @ApiProperty({
    description: 'Monto total del billing cycle',
    example: 1000.00,
    type: Number,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Moneda del billing cycle',
    example: 'USD',
    type: String,
  })
  currency: string;

  @ApiProperty({
    description: 'Fecha de pago del billing cycle',
    example: '2024-01-01T00:00:00Z',
    type: Date,
    nullable: true,
  })
  paymentDate: Date | null;

  @ApiProperty({
    description: 'Lista de comisiones',
    type: [CommissionDto],
  })
  commissions: CommissionDto[];

  @ApiProperty({
    description: 'Total de comisiones calculadas',
    example: 155.50,
    type: Number,
  })
  totalCommissions: number;

  constructor(
    billingCycleId: number,
    cycleNumber: number,
    totalAmount: number,
    currency: string,
    paymentDate: Date | null,
    commissions: CommissionDto[],
  ) {
    this.billingCycleId = billingCycleId;
    this.cycleNumber = cycleNumber;
    this.totalAmount = totalAmount;
    this.currency = currency;
    this.paymentDate = paymentDate;
    this.commissions = commissions;
    this.totalCommissions = commissions.reduce(
      (sum, c) => sum + c.commissionAmount,
      0,
    );
  }
}

