import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para estadísticas por período
 */
export class PeriodStatsDto {
  @ApiProperty({
    description: 'Fecha del período',
    example: '2024-01-15',
    type: String,
  })
  period: string;

  @ApiProperty({
    description: 'Total de comisiones en el período',
    example: 25,
    type: Number,
  })
  totalCommissions: number;

  @ApiProperty({
    description: 'Monto total de comisiones',
    example: 5000.00,
    type: Number,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Comisiones pendientes',
    example: 10,
    type: Number,
  })
  pendingCommissions: number;

  @ApiProperty({
    description: 'Comisiones pagadas',
    example: 15,
    type: Number,
  })
  paidCommissions: number;

  @ApiProperty({
    description: 'Moneda',
    example: 'USD',
    type: String,
  })
  currency: string;

  constructor(
    period: string,
    totalCommissions: number,
    totalAmount: number,
    pendingCommissions: number,
    paidCommissions: number,
    currency: string,
  ) {
    this.period = period;
    this.totalCommissions = totalCommissions;
    this.totalAmount = totalAmount;
    this.pendingCommissions = pendingCommissions;
    this.paidCommissions = paidCommissions;
    this.currency = currency;
  }
}

/**
 * DTO para top staff
 */
export class TopStaffDto {
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
    description: 'Total de comisiones',
    example: 50,
    type: Number,
  })
  totalCommissions: number;

  @ApiProperty({
    description: 'Monto total de comisiones',
    example: 10000.00,
    type: Number,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Monto pendiente',
    example: 3000.00,
    type: Number,
  })
  pendingAmount: number;

  @ApiProperty({
    description: 'Monto pagado',
    example: 7000.00,
    type: Number,
  })
  paidAmount: number;

  @ApiProperty({
    description: 'Moneda',
    example: 'USD',
    type: String,
  })
  currency: string;

  constructor(
    staffUserId: number,
    staffUserName: string,
    staffUserEmail: string,
    totalCommissions: number,
    totalAmount: number,
    pendingAmount: number,
    paidAmount: number,
    currency: string,
  ) {
    this.staffUserId = staffUserId;
    this.staffUserName = staffUserName;
    this.staffUserEmail = staffUserEmail;
    this.totalCommissions = totalCommissions;
    this.totalAmount = totalAmount;
    this.pendingAmount = pendingAmount;
    this.paidAmount = paidAmount;
    this.currency = currency;
  }
}

/**
 * DTO para top partners
 */
export class TopPartnerDto {
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
    description: 'Total de comisiones generadas',
    example: 30,
    type: Number,
  })
  totalCommissions: number;

  @ApiProperty({
    description: 'Monto total de comisiones',
    example: 8000.00,
    type: Number,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Moneda',
    example: 'USD',
    type: String,
  })
  currency: string;

  constructor(
    partnerId: number,
    partnerName: string,
    totalCommissions: number,
    totalAmount: number,
    currency: string,
  ) {
    this.partnerId = partnerId;
    this.partnerName = partnerName;
    this.totalCommissions = totalCommissions;
    this.totalAmount = totalAmount;
    this.currency = currency;
  }
}

/**
 * Response DTO para dashboard de comisiones
 */
export class GetCommissionsDashboardResponse {
  @ApiProperty({
    description: 'Período de consulta',
  })
  period: {
    startDate: Date;
    endDate: Date;
  };

  @ApiProperty({
    description: 'Resumen general',
  })
  summary: {
    totalCommissions: number;
    pendingCommissions: number;
    paidCommissions: number;
    cancelledCommissions: number;
    totalAmount: number;
    pendingAmount: number;
    paidAmount: number;
    cancelledAmount: number;
    averageCommissionAmount: number;
    currency: string;
  };

  @ApiProperty({
    description: 'Estadísticas por período (diario/semanal/mensual)',
    type: [PeriodStatsDto],
  })
  periodStats: PeriodStatsDto[];

  @ApiProperty({
    description: 'Top staff por comisiones',
    type: [TopStaffDto],
  })
  topStaff: TopStaffDto[];

  @ApiProperty({
    description: 'Top partners por comisiones generadas',
    type: [TopPartnerDto],
  })
  topPartners: TopPartnerDto[];

  @ApiProperty({
    description: 'Comparación con período anterior',
    required: false,
  })
  previousPeriodComparison?: {
    totalCommissionsChange: number;
    totalAmountChange: number;
    percentageChange: number;
  };

  constructor(
    period: { startDate: Date; endDate: Date },
    summary: {
      totalCommissions: number;
      pendingCommissions: number;
      paidCommissions: number;
      cancelledCommissions: number;
      totalAmount: number;
      pendingAmount: number;
      paidAmount: number;
      cancelledAmount: number;
      averageCommissionAmount: number;
      currency: string;
    },
    periodStats: PeriodStatsDto[],
    topStaff: TopStaffDto[],
    topPartners: TopPartnerDto[],
    previousPeriodComparison?: {
      totalCommissionsChange: number;
      totalAmountChange: number;
      percentageChange: number;
    },
  ) {
    this.period = period;
    this.summary = summary;
    this.periodStats = periodStats;
    this.topStaff = topStaff;
    this.topPartners = topPartners;
    this.previousPeriodComparison = previousPeriodComparison;
  }
}


