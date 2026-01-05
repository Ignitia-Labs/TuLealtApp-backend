import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para información de partner en desembolsos
 */
export class PartnerDisbursementDto {
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
    description: 'Monto pendiente de este partner',
    example: 500.0,
    type: Number,
  })
  amount: number;

  constructor(partnerId: number, partnerName: string, amount: number) {
    this.partnerId = partnerId;
    this.partnerName = partnerName;
    this.amount = amount;
  }
}

/**
 * DTO para un desembolso pendiente
 */
export class PendingDisbursementDto {
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
    description: 'Monto total pendiente',
    example: 1550.0,
    type: Number,
  })
  totalPendingAmount: number;

  @ApiProperty({
    description: 'Moneda',
    example: 'USD',
    type: String,
  })
  currency: string;

  @ApiProperty({
    description: 'Cantidad de comisiones pendientes',
    example: 10,
    type: Number,
  })
  pendingCommissions: number;

  @ApiProperty({
    description: 'Comisiones agrupadas por partner',
    type: [PartnerDisbursementDto],
  })
  partners: PartnerDisbursementDto[];

  constructor(
    staffUserId: number,
    staffUserName: string,
    staffUserEmail: string,
    totalPendingAmount: number,
    currency: string,
    pendingCommissions: number,
    partners: PartnerDisbursementDto[],
  ) {
    this.staffUserId = staffUserId;
    this.staffUserName = staffUserName;
    this.staffUserEmail = staffUserEmail;
    this.totalPendingAmount = totalPendingAmount;
    this.currency = currency;
    this.pendingCommissions = pendingCommissions;
    this.partners = partners;
  }
}

/**
 * Response DTO para obtener desembolsos pendientes
 */
export class GetPendingDisbursementsResponse {
  @ApiProperty({
    description: 'Lista de desembolsos pendientes',
    type: [PendingDisbursementDto],
  })
  disbursements: PendingDisbursementDto[];

  @ApiProperty({
    description: 'Resumen general',
  })
  summary: {
    totalStaff: number;
    totalPendingAmount: number;
    currency: string;
  };

  @ApiProperty({
    description: 'Información de paginación',
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  constructor(
    disbursements: PendingDisbursementDto[],
    summary: {
      totalStaff: number;
      totalPendingAmount: number;
      currency: string;
    },
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    },
  ) {
    this.disbursements = disbursements;
    this.summary = summary;
    this.pagination = pagination;
  }
}
