import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para actualizar una solicitud de partner
 */
export class UpdatePartnerRequestResponse {
  @ApiProperty({
    description: 'ID de la solicitud actualizada',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Estado de la solicitud',
    example: 'in-progress',
    enum: ['pending', 'in-progress', 'enrolled', 'rejected'],
  })
  status: 'pending' | 'in-progress' | 'enrolled' | 'rejected';

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

  @ApiProperty({
    description: 'ID del usuario que realizó la actualización',
    example: 5,
    type: Number,
    nullable: true,
  })
  updatedBy: number | null;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-11-14T09:30:00Z',
    type: Date,
  })
  lastUpdated: Date;

  constructor(
    id: number,
    status: 'pending' | 'in-progress' | 'enrolled' | 'rejected',
    name: string,
    email: string,
    updatedBy: number | null,
    lastUpdated: Date,
  ) {
    this.id = id;
    this.status = status;
    this.name = name;
    this.email = email;
    this.updatedBy = updatedBy;
    this.lastUpdated = lastUpdated;
  }
}
