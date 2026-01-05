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
 * Incluye todos los datos del customer y su membership fusionados
 */
export class PartnerCustomerItem {
  @ApiProperty({ description: 'ID de la asociación (membership)', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID del usuario (customer)', example: 10 })
  userId: number;

  @ApiProperty({ description: 'Nombre del customer', example: 'John Doe' })
  customerName: string;

  @ApiProperty({ description: 'Email del customer', example: 'john@example.com' })
  customerEmail: string;

  @ApiProperty({ description: 'Teléfono del customer', example: '+1234567890' })
  customerPhone: string;

  @ApiProperty({ description: 'ID del tenant', example: 1 })
  tenantId: number;

  @ApiProperty({ description: 'Nombre del tenant', example: 'Café Delicia - Centro' })
  tenantName: string;

  @ApiProperty({ description: 'ID de la branch de registro', example: 5, nullable: true })
  registrationBranchId: number | null;

  @ApiProperty({ description: 'Nombre de la branch de registro', example: 'Sucursal Centro' })
  registrationBranchName: string;

  @ApiProperty({ description: 'Estado de la asociación', example: 'active', enum: ['active', 'inactive'] })
  status: string;

  @ApiProperty({ description: 'Fecha de asociación', example: '2023-06-01T00:00:00.000Z', type: Date })
  joinedDate: Date;

  @ApiProperty({ description: 'Fecha de última actividad', example: '2024-01-15T10:30:00.000Z', nullable: true, type: Date })
  lastActivityDate: Date | null;

  @ApiProperty({ description: 'Cantidad de puntos del customer en este tenant', example: 1500 })
  points: number;

  @ApiProperty({ description: 'ID del tier actual del customer', example: 2, nullable: true })
  tierId: number | null;

  @ApiProperty({ description: 'Nombre del tier actual del customer', example: 'Oro', nullable: true })
  tierName: string | null;

  @ApiProperty({ description: 'Color del tier actual del customer', example: '#FFD700', nullable: true })
  tierColor: string | null;

  @ApiProperty({ description: 'Prioridad/ranking del tier (mayor número = tier más alto)', example: 3, nullable: true })
  tierPriority: number | null;

  @ApiProperty({ description: 'Total gastado en este tenant', example: 2500.5 })
  totalSpent: number;

  @ApiProperty({ description: 'Total de visitas a este tenant', example: 25 })
  totalVisits: number;

  @ApiProperty({ description: 'QR code único específico por tenant', example: 'QR-USER-10-TENANT-1-A3B5C7', nullable: true })
  qrCode: string | null;

  @ApiProperty({ description: 'Fecha de creación de la membership', example: '2023-06-01T00:00:00.000Z', type: Date })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización de la membership', example: '2024-01-15T10:30:00.000Z', type: Date })
  updatedAt: Date;

  constructor(
    id: number,
    userId: number,
    customerName: string,
    customerEmail: string,
    customerPhone: string,
    tenantId: number,
    tenantName: string,
    registrationBranchId: number | null,
    registrationBranchName: string,
    status: string,
    joinedDate: Date,
    lastActivityDate: Date | null,
    points: number,
    tierId: number | null,
    tierName: string | null,
    tierColor: string | null,
    tierPriority: number | null,
    totalSpent: number,
    totalVisits: number,
    qrCode: string | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.userId = userId;
    this.customerName = customerName;
    this.customerEmail = customerEmail;
    this.customerPhone = customerPhone;
    this.tenantId = tenantId;
    this.tenantName = tenantName;
    this.registrationBranchId = registrationBranchId;
    this.registrationBranchName = registrationBranchName;
    this.status = status;
    this.joinedDate = joinedDate;
    this.lastActivityDate = lastActivityDate;
    this.points = points;
    this.tierId = tierId;
    this.tierName = tierName;
    this.tierColor = tierColor;
    this.tierPriority = tierPriority;
    this.totalSpent = totalSpent;
    this.totalVisits = totalVisits;
    this.qrCode = qrCode;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

/**
 * DTO de response para obtener los customers de un partner (con paginación)
 */
export class GetPartnerCustomersResponse {
  @ApiProperty({
    description: 'Lista de asociaciones customer-partner',
    type: PartnerCustomerItem,
    isArray: true,
    example: [
      {
        id: 1,
        userId: 10,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+1234567890',
        tenantId: 1,
        tenantName: 'Café Delicia - Centro',
        registrationBranchId: 5,
        registrationBranchName: 'Sucursal Centro',
        status: 'active',
        joinedDate: '2023-06-01T00:00:00.000Z',
        lastActivityDate: '2024-01-15T10:30:00.000Z',
        points: 1500,
        tierId: 2,
        tierName: 'Oro',
        tierColor: '#FFD700',
        tierPriority: 3,
        totalSpent: 2500.5,
        totalVisits: 25,
        qrCode: 'QR-USER-10-TENANT-1-A3B5C7',
        createdAt: '2023-06-01T00:00:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    ],
  })
  data: PartnerCustomerItem[];

  @ApiProperty({
    description: 'Información de paginación',
    type: PaginationInfo,
    example: {
      page: 1,
      limit: 50,
      total: 1250,
      totalPages: 25,
    },
  })
  pagination: PaginationInfo;

  constructor(data: PartnerCustomerItem[], pagination: PaginationInfo) {
    this.data = data;
    this.pagination = pagination;
  }
}
