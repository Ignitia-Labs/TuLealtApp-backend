import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para crear una solicitud de partner
 */
export class CreatePartnerRequestResponse {
  @ApiProperty({
    description: 'ID de la solicitud creada',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Estado de la solicitud',
    example: 'pending',
    enum: ['pending', 'in-progress', 'enrolled', 'rejected'],
  })
  status: string;

  @ApiProperty({
    description: 'Fecha de envío de la solicitud',
    example: '2024-11-14T09:30:00Z',
    type: String,
  })
  submittedAt: string;

  @ApiProperty({
    description: 'Nombre del partner',
    example: 'Restaurante La Cocina del Sol',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Email del partner',
    example: 'roberto@cocinasol.gt',
    type: String,
  })
  email: string;

  constructor(
    id: number,
    status: string,
    submittedAt: Date,
    name: string,
    email: string,
  ) {
    this.id = id;
    this.status = status;
    this.submittedAt = submittedAt.toISOString();
    this.name = name;
    this.email = email;
  }
}
