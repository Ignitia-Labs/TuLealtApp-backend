import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para actualizar una branch
 */
export class UpdateBranchResponse {
  @ApiProperty({
    description: 'ID de la branch',
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
    description: 'Ciudad de la branch',
    example: 'Guatemala City',
    type: String,
  })
  city: string;

  @ApiProperty({
    description: 'País de la branch',
    example: 'Guatemala',
    type: String,
  })
  country: string;

  @ApiProperty({
    description: 'Teléfono de la branch',
    example: '+502 1234-5678',
    type: String,
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    description: 'Email de la branch',
    example: 'centro@cafedelicia.com',
    type: String,
    nullable: true,
  })
  email: string | null;

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

  @ApiProperty({
    description: 'Fecha de actualización de la branch',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(
    id: number,
    tenantId: number,
    name: string,
    address: string,
    city: string,
    country: string,
    phone: string | null,
    email: string | null,
    status: string,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.tenantId = tenantId;
    this.name = name;
    this.address = address;
    this.city = city;
    this.country = country;
    this.phone = phone;
    this.email = email;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

