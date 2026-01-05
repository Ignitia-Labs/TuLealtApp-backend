import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para resumen de comisiones por partner
 */
export class CommissionByPartnerDto {
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
    description: 'Total de comisiones',
    example: 10,
    type: Number,
  })
  totalCommissions: number;

  @ApiProperty({
    description: 'Monto total de comisiones',
    example: 1550.0,
    type: Number,
  })
  totalAmount: number;

  constructor(
    partnerId: number,
    partnerName: string,
    totalCommissions: number,
    totalAmount: number,
  ) {
    this.partnerId = partnerId;
    this.partnerName = partnerName;
    this.totalCommissions = totalCommissions;
    this.totalAmount = totalAmount;
  }
}

/**
 * Response DTO para obtener resumen de comisiones
 */
export class GetCommissionSummaryResponse {
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
    description: 'Período de consulta',
  })
  period: {
    startDate: Date;
    endDate: Date;
  };

  @ApiProperty({
    description: 'Resumen de comisiones',
  })
  summary: {
    totalCommissions: number;
    pendingCommissions: number;
    paidCommissions: number;
    cancelledCommissions: number;
    totalAmount: number;
    pendingAmount: number;
    paidAmount: number;
    currency: string;
  };

  @ApiProperty({
    description: 'Comisiones agrupadas por partner',
    type: [CommissionByPartnerDto],
  })
  byPartner: CommissionByPartnerDto[];

  constructor(
    staffUserId: number,
    staffUserName: string,
    period: { startDate: Date; endDate: Date },
    summary: {
      totalCommissions: number;
      pendingCommissions: number;
      paidCommissions: number;
      cancelledCommissions: number;
      totalAmount: number;
      pendingAmount: number;
      paidAmount: number;
      currency: string;
    },
    byPartner: CommissionByPartnerDto[],
  ) {
    this.staffUserId = staffUserId;
    this.staffUserName = staffUserName;
    this.period = period;
    this.summary = summary;
    this.byPartner = byPartner;
  }
}
