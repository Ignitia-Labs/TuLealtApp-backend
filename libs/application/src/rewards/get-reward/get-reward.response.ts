import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para obtener una recompensa
 */
export class GetRewardResponse {
  @ApiProperty({
    description: 'ID único de la recompensa',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID del tenant al que pertenece la recompensa',
    example: 1,
    type: Number,
  })
  tenantId: number;

  @ApiProperty({
    description: 'Nombre de la recompensa',
    example: 'Descuento del 20%',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Descripción de la recompensa',
    example: 'Obtén un descuento del 20% en tu próxima compra',
    type: String,
  })
  description: string;

  @ApiProperty({
    description: 'URL de la imagen de la recompensa',
    example: 'https://example.com/reward-image.jpg',
    type: String,
    nullable: true,
  })
  image: string | null;

  @ApiProperty({
    description: 'Puntos requeridos para canjear la recompensa',
    example: 500,
    type: Number,
  })
  pointsRequired: number;

  @ApiProperty({
    description: 'Stock disponible de la recompensa',
    example: 100,
    type: Number,
  })
  stock: number;

  @ApiProperty({
    description: 'Máximo de canjes permitidos por usuario (null para ilimitado)',
    example: 1,
    type: Number,
    nullable: true,
  })
  maxRedemptionsPerUser: number | null;

  @ApiProperty({
    description: 'Estado de la recompensa',
    example: 'active',
    enum: ['active', 'inactive', 'out_of_stock'],
    enumName: 'RewardStatus',
  })
  status: 'active' | 'inactive' | 'out_of_stock';

  @ApiProperty({
    description: 'Categoría de la recompensa',
    example: 'Descuentos',
    type: String,
  })
  category: string;

  @ApiProperty({
    description: 'Términos y condiciones de la recompensa',
    example: 'Válido hasta fin de mes',
    type: String,
    nullable: true,
  })
  terms: string | null;

  @ApiProperty({
    description: 'Fecha de vencimiento de la recompensa',
    example: '2024-12-31T23:59:59Z',
    type: Date,
    nullable: true,
  })
  validUntil: Date | null;

  @ApiProperty({
    description: 'Fecha de creación de la recompensa',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización de la recompensa',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(
    id: number,
    tenantId: number,
    name: string,
    description: string,
    image: string | null,
    pointsRequired: number,
    stock: number,
    maxRedemptionsPerUser: number | null,
    status: 'active' | 'inactive' | 'out_of_stock',
    category: string,
    terms: string | null,
    validUntil: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.tenantId = tenantId;
    this.name = name;
    this.description = description;
    this.image = image;
    this.pointsRequired = pointsRequired;
    this.stock = stock;
    this.maxRedemptionsPerUser = maxRedemptionsPerUser;
    this.status = status;
    this.category = category;
    this.terms = terms;
    this.validUntil = validUntil;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
