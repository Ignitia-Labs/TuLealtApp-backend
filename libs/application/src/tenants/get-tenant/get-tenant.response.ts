import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para obtener un tenant
 */
export class GetTenantResponse {
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
    example: 'currency-8',
    type: String,
  })
  currencyId: string;

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
    example: '2024-01-05T00:00:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Habilitar escaneo QR',
    example: true,
    type: Boolean,
  })
  qrScanning: boolean;

  @ApiProperty({
    description: 'Habilitar modo offline',
    example: true,
    type: Boolean,
  })
  offlineMode: boolean;

  @ApiProperty({
    description: 'Habilitar programa de referidos',
    example: true,
    type: Boolean,
  })
  referralProgram: boolean;

  @ApiProperty({
    description: 'Habilitar recompensas de cumpleaños',
    example: true,
    type: Boolean,
  })
  birthdayRewards: boolean;

  constructor(
    id: number,
    partnerId: number,
    name: string,
    description: string | null,
    logo: string | null,
    banner: string | null,
    category: string,
    currencyId: string,
    primaryColor: string,
    secondaryColor: string,
    pointsExpireDays: number,
    minPointsToRedeem: number,
    status: string,
    createdAt: Date,
    updatedAt: Date,
    qrScanning: boolean,
    offlineMode: boolean,
    referralProgram: boolean,
    birthdayRewards: boolean,
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
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.qrScanning = qrScanning;
    this.offlineMode = offlineMode;
    this.referralProgram = referralProgram;
    this.birthdayRewards = birthdayRewards;
  }
}
