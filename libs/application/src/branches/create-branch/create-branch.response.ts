import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para crear una branch
 */
export class CreateBranchResponse {
  @ApiProperty({
    description: 'ID de la branch creada',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID del tenant',
    example: 1,
    type: Number,
  })
  tenantId: number;

  @ApiProperty({
    description: 'Nombre de la branch',
    example: 'Café Delicia - Centro',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Dirección de la branch',
    example: 'Calle Principal 123, Zona 1',
    type: String,
  })
  address: string;

  @ApiProperty({
    description: 'Estado de la branch',
    example: 'active',
    type: String,
  })
  status: string;

  @ApiProperty({
    description: 'Fecha de creación de la branch',
    example: '2024-01-05T00:00:00.000Z',
    type: Date,
  })
  createdAt: Date;

  constructor(
    id: number,
    tenantId: number,
    name: string,
    address: string,
    status: string,
    createdAt: Date,
  ) {
    this.id = id;
    this.tenantId = tenantId;
    this.name = name;
    this.address = address;
    this.status = status;
    this.createdAt = createdAt;
  }
}
