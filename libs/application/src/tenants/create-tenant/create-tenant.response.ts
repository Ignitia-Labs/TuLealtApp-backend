import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para crear un tenant
 */
export class CreateTenantResponse {
  @ApiProperty({
    description: 'ID del tenant creado',
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
    description: 'Categoría del tenant',
    example: 'Cafeterías',
    type: String,
  })
  category: string;

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

  constructor(
    id: number,
    partnerId: number,
    name: string,
    category: string,
    status: string,
    createdAt: Date,
  ) {
    this.id = id;
    this.partnerId = partnerId;
    this.name = name;
    this.category = category;
    this.status = status;
    this.createdAt = createdAt;
  }
}
