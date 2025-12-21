import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para crear un partner
 */
export class CreatePartnerResponse {
  @ApiProperty({
    description: 'ID del partner creado',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Nombre del partner',
    example: 'Grupo Comercial ABC',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Email del partner',
    example: 'maria@abc-comercial.com',
    type: String,
  })
  email: string;

  @ApiProperty({
    description: 'Dominio del partner',
    example: 'abc-comercial.com',
    type: String,
  })
  domain: string;

  @ApiProperty({
    description: 'Plan del partner',
    example: 'conecta',
    type: String,
  })
  plan: string;

  @ApiProperty({
    description: 'Estado del partner',
    example: 'active',
    type: String,
  })
  status: string;

  @ApiProperty({
    description: 'Fecha de creación del partner',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  createdAt: Date;

  constructor(
    id: number,
    name: string,
    email: string,
    domain: string,
    plan: string,
    status: string,
    createdAt: Date,
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.domain = domain;
    this.plan = plan;
    this.status = status;
    this.createdAt = createdAt;
  }
}
