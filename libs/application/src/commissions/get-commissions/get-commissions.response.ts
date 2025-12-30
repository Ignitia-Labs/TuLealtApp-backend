import { ApiProperty } from '@nestjs/swagger';
import { CommissionDto } from '../get-payment-commissions/get-payment-commissions.response';

/**
 * Response DTO para obtener comisiones con filtros
 */
export class GetCommissionsResponse {
  @ApiProperty({
    description: 'ID del usuario staff (si se filtró por staff)',
    example: 5,
    type: Number,
    required: false,
  })
  staffUserId?: number;

  @ApiProperty({
    description: 'Nombre del usuario staff',
    example: 'Juan Pérez',
    type: String,
    required: false,
  })
  staffUserName?: string;

  @ApiProperty({
    description: 'ID del partner (si se filtró por partner)',
    example: 1,
    type: Number,
    required: false,
  })
  partnerId?: number;

  @ApiProperty({
    description: 'Nombre del partner',
    example: 'Restaurante La Cocina',
    type: String,
    required: false,
  })
  partnerName?: string;

  @ApiProperty({
    description: 'Lista de comisiones',
    type: [CommissionDto],
  })
  commissions: CommissionDto[];

  @ApiProperty({
    description: 'Resumen de comisiones',
  })
  summary: {
    totalPending: number;
    totalPaid: number;
    totalCancelled: number;
    totalAmount: number;
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
    commissions: CommissionDto[],
    summary: {
      totalPending: number;
      totalPaid: number;
      totalCancelled: number;
      totalAmount: number;
      currency: string;
    },
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    },
    staffUserId?: number,
    staffUserName?: string,
    partnerId?: number,
    partnerName?: string,
  ) {
    this.commissions = commissions;
    this.summary = summary;
    this.pagination = pagination;
    this.staffUserId = staffUserId;
    this.staffUserName = staffUserName;
    this.partnerId = partnerId;
    this.partnerName = partnerName;
  }
}

