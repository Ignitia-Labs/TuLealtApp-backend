import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para obtener un customer por QR code
 * Incluye información del usuario y su membership
 */
export class GetCustomerByQrResponse {
  @ApiProperty({ description: 'ID de la asociación (membership)', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID del usuario (customer)', example: 10 })
  userId: number;

  @ApiProperty({ description: 'Nombre del customer', example: 'John Doe' })
  customerName: string;

  @ApiProperty({ description: 'Email del customer', example: 'john@example.com' })
  customerEmail: string;

  @ApiProperty({ description: 'Teléfono del customer', example: '+1234567890', nullable: true })
  customerPhone: string | null;

  @ApiProperty({ description: 'ID del tenant', example: 1 })
  tenantId: number;

  @ApiProperty({ description: 'Nombre del tenant', example: 'Café Delicia - Centro' })
  tenantName: string;

  @ApiProperty({ description: 'ID de la branch de registro', example: 5, nullable: true })
  registrationBranchId: number | null;

  @ApiProperty({ description: 'Nombre de la branch de registro', example: 'Sucursal Centro', nullable: true })
  registrationBranchName: string | null;

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

  @ApiProperty({ description: 'QR code único específico por tenant', example: 'QR-USER-10-TENANT-1-A3B5C7' })
  qrCode: string;

  @ApiProperty({ description: 'Fecha de creación de la membership', example: '2023-06-01T00:00:00.000Z', type: Date })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización de la membership', example: '2024-01-15T10:30:00.000Z', type: Date })
  updatedAt: Date;

  constructor(
    id: number,
    userId: number,
    customerName: string,
    customerEmail: string,
    customerPhone: string | null,
    tenantId: number,
    tenantName: string,
    registrationBranchId: number | null,
    registrationBranchName: string | null,
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
    qrCode: string,
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

