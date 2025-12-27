import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para crear una alerta de suscripción
 */
export class CreateSubscriptionAlertResponse {
  @ApiProperty({
    description: 'ID de la alerta creada',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID de la suscripción',
    example: 1,
    type: Number,
  })
  subscriptionId: number;

  @ApiProperty({
    description: 'Tipo de alerta',
    example: 'renewal',
    type: String,
  })
  type: string;

  @ApiProperty({
    description: 'Severidad',
    example: 'info',
    type: String,
  })
  severity: string;

  @ApiProperty({
    description: 'Título',
    example: 'Renovación próxima',
    type: String,
  })
  title: string;

  @ApiProperty({
    description: 'Estado',
    example: 'active',
    type: String,
  })
  status: string;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  createdAt: Date;

  constructor(
    id: number,
    subscriptionId: number,
    type: string,
    severity: string,
    title: string,
    status: string,
    createdAt: Date,
  ) {
    this.id = id;
    this.subscriptionId = subscriptionId;
    this.type = type;
    this.severity = severity;
    this.title = title;
    this.status = status;
    this.createdAt = createdAt;
  }
}

