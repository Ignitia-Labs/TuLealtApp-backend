import { ApiProperty } from '@nestjs/swagger';

/**
 * Información de paginación
 */
export class PaginationInfo {
  @ApiProperty({ description: 'Página actual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Límite de resultados por página', example: 50 })
  limit: number;

  @ApiProperty({ description: 'Total de registros', example: 1250 })
  total: number;

  @ApiProperty({ description: 'Total de páginas', example: 25 })
  totalPages: number;

  constructor(page: number, limit: number, total: number) {
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.totalPages = Math.ceil(total / limit);
  }
}

/**
 * Item de customer en la lista de partners
 */
export class PartnerCustomerItem {
  @ApiProperty({ description: 'ID de la asociación', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID del usuario (customer)', example: 10 })
  userId: number;

  @ApiProperty({ description: 'Nombre del customer', example: 'John Doe' })
  customerName: string;

  @ApiProperty({ description: 'Email del customer', example: 'john@example.com' })
  customerEmail: string;

  @ApiProperty({ description: 'ID del tenant', example: 1 })
  tenantId: number;

  @ApiProperty({ description: 'Nombre del tenant', example: 'Café Delicia - Centro' })
  tenantName: string;

  @ApiProperty({ description: 'ID de la branch de registro', example: 5 })
  registrationBranchId: number;

  @ApiProperty({ description: 'Nombre de la branch de registro', example: 'Sucursal Centro' })
  registrationBranchName: string;

  @ApiProperty({ description: 'Estado de la asociación', example: 'active' })
  status: string;

  @ApiProperty({ description: 'Fecha de asociación' })
  joinedDate: Date;

  @ApiProperty({ description: 'Fecha de última actividad', nullable: true })
  lastActivityDate: Date | null;

  constructor(
    id: number,
    userId: number,
    customerName: string,
    customerEmail: string,
    tenantId: number,
    tenantName: string,
    registrationBranchId: number,
    registrationBranchName: string,
    status: string,
    joinedDate: Date,
    lastActivityDate: Date | null,
  ) {
    this.id = id;
    this.userId = userId;
    this.customerName = customerName;
    this.customerEmail = customerEmail;
    this.tenantId = tenantId;
    this.tenantName = tenantName;
    this.registrationBranchId = registrationBranchId;
    this.registrationBranchName = registrationBranchName;
    this.status = status;
    this.joinedDate = joinedDate;
    this.lastActivityDate = lastActivityDate;
  }
}

/**
 * DTO de response para obtener los customers de un partner (con paginación)
 */
export class GetPartnerCustomersResponse {
  @ApiProperty({
    description: 'Lista de asociaciones customer-partner',
    type: Array,
  })
  data: PartnerCustomerItem[];

  @ApiProperty({
    description: 'Información de paginación',
    type: Object,
  })
  pagination: PaginationInfo;

  constructor(data: PartnerCustomerItem[], pagination: PaginationInfo) {
    this.data = data;
    this.pagination = pagination;
  }
}
