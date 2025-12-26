import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para agregar notas a una solicitud de partner
 */
export class AddPartnerRequestNotesResponse {
  @ApiProperty({
    description: 'ID de la solicitud',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Notas actualizadas',
    example: 'Revisando documentación fiscal',
    type: String,
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'Última actualización',
    example: '2024-11-14T10:30:00Z',
    type: String,
  })
  lastUpdated: string;

  constructor(id: number, notes: string | null, lastUpdated: Date) {
    this.id = id;
    this.notes = notes;
    this.lastUpdated = lastUpdated.toISOString();
  }
}
