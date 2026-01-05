import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para CustomerMembership con información denormalizada
 * Incluye información del tenant, branch y tier para facilitar el frontend
 */
export class CustomerMembershipDto {
  @ApiProperty({
    description: 'ID de la membership',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID del usuario (customer)',
    example: 10,
    type: Number,
  })
  userId: number;

  @ApiProperty({
    description: 'ID del tenant (merchant)',
    example: 1,
    type: Number,
  })
  tenantId: number;

  @ApiProperty({
    description: 'Nombre del tenant',
    example: 'Café Delicia',
    type: String,
  })
  tenantName: string;

  @ApiProperty({
    description: 'Logo del tenant',
    example: 'https://example.com/logo.png',
    type: String,
    nullable: true,
  })
  tenantLogo: string | null;

  @ApiProperty({
    description: 'Imagen del tenant (puede ser igual al logo)',
    example: 'https://example.com/image.png',
    type: String,
    nullable: true,
  })
  tenantImage: string | null;

  @ApiProperty({
    description: 'Categoría del tenant',
    example: 'restaurant',
    type: String,
  })
  category: string;

  @ApiProperty({
    description: 'Color primario del tenant',
    example: '#FF5733',
    type: String,
  })
  primaryColor: string;

  @ApiProperty({
    description: 'ID de la branch donde se registró el customer',
    example: 5,
    type: Number,
  })
  registrationBranchId: number;

  @ApiProperty({
    description: 'Nombre de la branch donde se registró',
    example: 'Café Delicia - Centro',
    type: String,
  })
  registrationBranchName: string;

  @ApiProperty({
    description: 'Puntos específicos de este tenant',
    example: 1500,
    type: Number,
  })
  points: number;

  @ApiProperty({
    description: 'ID del tier actual del customer en este tenant',
    example: 2,
    type: Number,
    nullable: true,
  })
  tierId: number | null;

  @ApiProperty({
    description: 'Nombre del tier actual',
    example: 'Gold',
    type: String,
    nullable: true,
  })
  tierName: string | null;

  @ApiProperty({
    description: 'Color del tier actual',
    example: '#FFD700',
    type: String,
    nullable: true,
  })
  tierColor: string | null;

  @ApiProperty({
    description: 'Total gastado en este tenant',
    example: 2500.5,
    type: Number,
  })
  totalSpent: number;

  @ApiProperty({
    description: 'Total de visitas a este tenant',
    example: 25,
    type: Number,
  })
  totalVisits: number;

  @ApiProperty({
    description: 'Fecha de la última visita',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
    nullable: true,
  })
  lastVisit: Date | null;

  @ApiProperty({
    description: 'Fecha de registro en este tenant',
    example: '2023-06-01T00:00:00.000Z',
    type: Date,
  })
  joinedDate: Date;

  @ApiProperty({
    description: 'Número de rewards disponibles para canjear (calculado)',
    example: 3,
    type: Number,
  })
  availableRewards: number;

  @ApiProperty({
    description: 'QR code único específico por tenant',
    example: 'QR-USER-10-TENANT-1-A3B5C7',
    type: String,
    nullable: true,
  })
  qrCode: string | null;

  @ApiProperty({
    description: 'Estado de la membership',
    example: 'active',
    enum: ['active', 'inactive'],
    type: String,
  })
  status: 'active' | 'inactive';

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2023-06-01T00:00:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(
    id: number,
    userId: number,
    tenantId: number,
    tenantName: string,
    tenantLogo: string | null,
    tenantImage: string | null,
    category: string,
    primaryColor: string,
    registrationBranchId: number,
    registrationBranchName: string,
    points: number,
    tierId: number | null,
    tierName: string | null,
    tierColor: string | null,
    totalSpent: number,
    totalVisits: number,
    lastVisit: Date | null,
    joinedDate: Date,
    availableRewards: number,
    qrCode: string | null,
    status: 'active' | 'inactive',
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.userId = userId;
    this.tenantId = tenantId;
    this.tenantName = tenantName;
    this.tenantLogo = tenantLogo;
    this.tenantImage = tenantImage;
    this.category = category;
    this.primaryColor = primaryColor;
    this.registrationBranchId = registrationBranchId;
    this.registrationBranchName = registrationBranchName;
    this.points = points;
    this.tierId = tierId;
    this.tierName = tierName;
    this.tierColor = tierColor;
    this.totalSpent = totalSpent;
    this.totalVisits = totalVisits;
    this.lastVisit = lastVisit;
    this.joinedDate = joinedDate;
    this.availableRewards = availableRewards;
    this.qrCode = qrCode;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
