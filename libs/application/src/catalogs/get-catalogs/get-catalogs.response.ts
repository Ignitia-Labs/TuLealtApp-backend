import { ApiProperty } from '@nestjs/swagger';
import { CatalogSwaggerDto } from '../dto/catalog-swagger.dto';

/**
 * DTO de response para obtener catálogos
 */
export class GetCatalogsResponse {
  @ApiProperty({
    description: 'Lista de elementos de catálogo',
    type: CatalogSwaggerDto,
    isArray: true,
    example: [
      {
        id: 1,
        type: 'BUSINESS_CATEGORIES',
        value: 'Restaurante',
        slug: 'restaurant',
        displayOrder: 1,
        isActive: true,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
      {
        id: 2,
        type: 'BUSINESS_CATEGORIES',
        value: 'Retail / Tienda',
        slug: 'retail',
        displayOrder: 2,
        isActive: true,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
      {
        id: 10,
        type: 'REWARD_TYPES',
        value: 'Por monto de compra',
        slug: 'por-monto-compra',
        displayOrder: 1,
        isActive: true,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    ],
  })
  catalogs: CatalogSwaggerDto[];

  constructor(catalogs: CatalogSwaggerDto[]) {
    this.catalogs = catalogs;
  }
}
