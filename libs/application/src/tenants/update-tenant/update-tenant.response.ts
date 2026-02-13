import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para actualizar un tenant
 */
export class UpdateTenantResponse {
  @ApiProperty({
    description: 'ID del tenant',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID del partner',
    example: 1,
    type: Number,
  })
  partnerId: number;

  @ApiProperty({
    description: 'Nombre del tenant',
    example: 'Café Delicia',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Descripción del tenant',
    example: 'Cafetería gourmet con sabor artesanal',
    type: String,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Logo del tenant',
    example: 'https://ui-avatars.com/api/?name=Cafe+Delicia&background=ec4899&color=fff',
    type: String,
    nullable: true,
  })
  logo: string | null;

  @ApiProperty({
    description: 'Banner del tenant',
    example: 'http://localhost:9000/tulealtapp-images/tenants/abc123-banner.png',
    type: String,
    nullable: true,
  })
  banner: string | null;

  @ApiProperty({
    description: 'Categoría del tenant',
    example: 'Cafeterías',
    type: String,
  })
  category: string;

  @ApiProperty({
    description: 'ID de la moneda',
    example: 8,
    type: Number,
  })
  currencyId: number;

  @ApiProperty({
    description: 'Color primario',
    example: '#ec4899',
    type: String,
  })
  primaryColor: string;

  @ApiProperty({
    description: 'Color secundario',
    example: '#fbbf24',
    type: String,
  })
  secondaryColor: string;

  @ApiProperty({
    description: 'Días hasta que expiren los puntos',
    example: 365,
    type: Number,
  })
  pointsExpireDays: number;

  @ApiProperty({
    description: 'Puntos mínimos para canjear',
    example: 100,
    type: Number,
  })
  minPointsToRedeem: number;

  @ApiProperty({
    description: 'Porcentaje de impuestos aplicable al tenant',
    example: 12.5,
    type: Number,
  })
  taxPercentage: number;

  @ApiProperty({
    description: 'TTL en minutos para códigos de canje',
    example: 15,
    type: Number,
  })
  redemptionCodeTtlMinutes: number;

  @ApiProperty({
    description: 'Estado del tenant',
    example: 'active',
    type: String,
  })
  status: string;

  @ApiProperty({
    description: 'Fecha de creación del tenant',
    example: '2024-01-05T00:00:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de actualización del tenant',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(
    id: number,
    partnerId: number,
    name: string,
    description: string | null,
    logo: string | null,
    banner: string | null,
    category: string,
    currencyId: number,
    primaryColor: string,
    secondaryColor: string,
    pointsExpireDays: number,
    minPointsToRedeem: number,
    taxPercentage: number,
    redemptionCodeTtlMinutes: number,
    status: string,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.partnerId = partnerId;
    this.name = name;
    this.description = description;
    this.logo = logo;
    this.banner = banner;
    this.category = category;
    this.currencyId = currencyId;
    this.primaryColor = primaryColor;
    this.secondaryColor = secondaryColor;
    this.pointsExpireDays = pointsExpireDays;
    this.minPointsToRedeem = minPointsToRedeem;
    this.taxPercentage = taxPercentage;
    this.redemptionCodeTtlMinutes = redemptionCodeTtlMinutes;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
