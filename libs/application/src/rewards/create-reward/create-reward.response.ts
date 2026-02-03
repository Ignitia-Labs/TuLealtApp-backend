import { ApiProperty } from '@nestjs/swagger';
import { Reward } from '@libs/domain';

/**
 * DTO de response para crear una recompensa
 */
export class CreateRewardResponse {
  @ApiProperty({
    description: 'ID de la recompensa creada',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID del tenant propietario',
    example: 1,
    type: Number,
  })
  tenantId: number;

  @ApiProperty({
    description: 'Nombre de la recompensa',
    example: 'Descuento del 10%',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Descripción de la recompensa',
    example: 'Obtén un descuento del 10% en tu próxima compra',
    type: String,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'URL de la imagen',
    example: 'https://example.com/reward-image.jpg',
    type: String,
    nullable: true,
  })
  image: string | null;

  @ApiProperty({
    description: 'Puntos requeridos para canjear',
    example: 100,
    type: Number,
  })
  pointsRequired: number;

  @ApiProperty({
    description: 'Stock disponible. -1 significa stock ilimitado',
    example: 50,
    type: Number,
  })
  stock: number;

  @ApiProperty({
    description: 'Límite de canjes por usuario',
    example: 1,
    type: Number,
    nullable: true,
  })
  maxRedemptionsPerUser: number | null;

  @ApiProperty({
    description: 'Estado de la recompensa',
    example: 'draft',
    enum: ['active', 'inactive', 'draft', 'expired'],
  })
  status: 'active' | 'inactive' | 'draft' | 'expired';

  @ApiProperty({
    description: 'Categoría de la recompensa',
    example: 'Descuentos',
    type: String,
  })
  category: string;

  @ApiProperty({
    description: 'Términos y condiciones',
    example: 'Válido solo para compras mayores a $50',
    type: String,
    nullable: true,
  })
  terms: string | null;

  @ApiProperty({
    description: 'Fecha de expiración. null significa válida de forma perpetua',
    example: '2026-12-31T23:59:59Z',
    type: String,
    nullable: true,
  })
  validUntil: Date | null;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2026-02-02T10:00:00Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de actualización',
    example: '2026-02-02T10:00:00Z',
    type: Date,
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Total de redemptions globales de esta recompensa (todas las memberships)',
    example: 42,
    type: Number,
  })
  totalRedemptions: number;

  constructor(reward: Reward, totalRedemptions: number = 0) {
    this.id = reward.id;
    this.tenantId = reward.tenantId;
    this.name = reward.name;
    this.description = reward.description;
    this.image = reward.image;
    this.pointsRequired = reward.pointsRequired;
    this.stock = reward.stock;
    this.maxRedemptionsPerUser = reward.maxRedemptionsPerUser;
    this.status = reward.status;
    this.category = reward.category;
    this.terms = reward.terms;
    this.validUntil = reward.validUntil;
    this.createdAt = reward.createdAt;
    this.updatedAt = reward.updatedAt;
    this.totalRedemptions = totalRedemptions;
  }
}
