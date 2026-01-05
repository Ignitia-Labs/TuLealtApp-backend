import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para actualizar un registro de uso de suscripción
 */
export class UpdateSubscriptionUsageResponse {
  @ApiProperty({
    description: 'ID del registro de uso actualizado',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Fecha de actualización',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(id: number, updatedAt: Date) {
    this.id = id;
    this.updatedAt = updatedAt;
  }
}
