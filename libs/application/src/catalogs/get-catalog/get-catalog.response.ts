import { ApiProperty } from '@nestjs/swagger';
import { CatalogType } from '@libs/domain';

/**
 * DTO de response para obtener un catálogo por ID
 */
export class GetCatalogResponse {
  @ApiProperty({
    description: 'ID único del elemento de catálogo',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Tipo de catálogo',
    example: 'BUSINESS_CATEGORIES',
    enum: ['BUSINESS_CATEGORIES', 'REWARD_TYPES', 'PAYMENT_METHODS', 'PAYMENT_CATEGORIES'],
    type: String,
  })
  type: CatalogType;

  @ApiProperty({
    description: 'Valor del elemento de catálogo',
    example: 'Restaurantes',
    type: String,
  })
  value: string;

  @ApiProperty({
    description: 'Slug único del elemento de catálogo',
    example: 'restaurantes',
    type: String,
  })
  slug: string;

  @ApiProperty({
    description: 'Orden de visualización del elemento',
    example: 1,
    type: Number,
  })
  displayOrder: number;

  @ApiProperty({
    description: 'Indica si el elemento está activo',
    example: true,
    type: Boolean,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de creación del elemento',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del elemento',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(
    id: number,
    type: CatalogType,
    value: string,
    slug: string,
    displayOrder: number,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.type = type;
    this.value = value;
    this.slug = slug;
    this.displayOrder = displayOrder;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
