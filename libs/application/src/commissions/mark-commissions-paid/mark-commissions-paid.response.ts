import { ApiProperty } from '@nestjs/swagger';
import { CommissionDto } from '../get-payment-commissions/get-payment-commissions.response';

/**
 * Response DTO para marcar comisiones como pagadas
 */
export class MarkCommissionsPaidResponse {
  @ApiProperty({
    description: 'Cantidad de comisiones actualizadas',
    example: 3,
    type: Number,
  })
  updated: number;

  @ApiProperty({
    description: 'Comisiones actualizadas',
    type: [CommissionDto],
  })
  commissions: CommissionDto[];

  constructor(updated: number, commissions: CommissionDto[]) {
    this.updated = updated;
    this.commissions = commissions;
  }
}

