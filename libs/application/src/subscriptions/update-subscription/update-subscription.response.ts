import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para actualizar una suscripción
 */
export class UpdateSubscriptionResponse {
  @ApiProperty({
    description: 'ID de la suscripción actualizada',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Estado de la suscripción',
    example: 'active',
    type: String,
  })
  status: string;

  @ApiProperty({
    description: 'Fecha de actualización',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(id: number, status: string, updatedAt: Date) {
    this.id = id;
    this.status = status;
    this.updatedAt = updatedAt;
  }
}

