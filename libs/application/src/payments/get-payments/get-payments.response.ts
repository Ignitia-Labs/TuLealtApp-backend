import { ApiProperty } from '@nestjs/swagger';
import { GetPaymentResponse } from '../get-payment/get-payment.response';

/**
 * DTO de response para obtener múltiples pagos
 */
export class GetPaymentsResponse {
  @ApiProperty({
    description: 'Lista de pagos',
    type: GetPaymentResponse,
    isArray: true,
  })
  payments: GetPaymentResponse[];

  @ApiProperty({
    description: 'Total de pagos encontrados',
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
    payments: GetPaymentResponse[],
    total: number,
    page: number | null,
    limit: number | null,
  ) {
    this.payments = payments;
    this.total = total;
    this.page = page;
    this.limit = limit;
  }
}

