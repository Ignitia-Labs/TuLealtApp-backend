import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para actualizar el estado de una solicitud de partner
 */
export class UpdatePartnerRequestStatusResponse {
  @ApiProperty({
    description: 'ID de la solicitud',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Estado actualizado',
    example: 'in-progress',
    enum: ['pending', 'in-progress', 'enrolled', 'rejected'],
  })
  status: string;

  @ApiProperty({
    description: 'ID del usuario asignado',
    example: 1,
    type: Number,
    nullable: true,
  })
  assignedTo: number | null;

  @ApiProperty({
    description: 'Última actualización',
    example: '2024-11-14T10:30:00Z',
    type: String,
  })
  lastUpdated: string;

  constructor(id: number, status: string, assignedTo: number | null, lastUpdated: Date) {
    this.id = id;
    this.status = status;
    this.assignedTo = assignedTo;
    this.lastUpdated = lastUpdated.toISOString();
  }
}
