import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO para asignar un usuario a una solicitud de partner
 */
export class AssignPartnerRequestUserResponse {
  @ApiProperty({
    description: 'ID de la solicitud de partner',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID del usuario asignado',
    example: 5,
    type: Number,
    nullable: true,
  })
  assignedTo: number | null;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-11-14T09:30:00Z',
    type: Date,
  })
  lastUpdated: Date;

  constructor(id: number, assignedTo: number | null, lastUpdated: Date) {
    this.id = id;
    this.assignedTo = assignedTo;
    this.lastUpdated = lastUpdated;
  }
}
