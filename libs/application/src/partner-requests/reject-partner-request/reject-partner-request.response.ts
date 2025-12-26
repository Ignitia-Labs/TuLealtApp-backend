import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para rechazar una solicitud de partner
 */
export class RejectPartnerRequestResponse {
  @ApiProperty({
    description: 'ID de la solicitud',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Estado actualizado',
    example: 'rejected',
    enum: ['rejected'],
  })
  status: string;

  @ApiProperty({
    description: 'Última actualización',
    example: '2024-11-14T10:30:00Z',
    type: String,
  })
  lastUpdated: string;

  constructor(id: number, status: string, lastUpdated: Date) {
    this.id = id;
    this.status = status;
    this.lastUpdated = lastUpdated.toISOString();
  }
}
