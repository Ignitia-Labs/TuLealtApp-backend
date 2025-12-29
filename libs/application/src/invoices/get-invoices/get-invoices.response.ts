import { ApiProperty } from '@nestjs/swagger';
import { GetInvoiceResponse } from '../get-invoice/get-invoice.response';

/**
 * DTO de response para obtener múltiples facturas
 */
export class GetInvoicesResponse {
  @ApiProperty({
    description: 'Lista de facturas',
    type: GetInvoiceResponse,
    isArray: true,
  })
  invoices: GetInvoiceResponse[];

  @ApiProperty({
    description: 'Total de facturas encontradas',
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
    invoices: GetInvoiceResponse[],
    total: number,
    page: number | null,
    limit: number | null,
  ) {
    this.invoices = invoices;
    this.total = total;
    this.page = page;
    this.limit = limit;
  }
}

