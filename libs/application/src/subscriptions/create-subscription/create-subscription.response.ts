import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para crear una suscripción
 */
export class CreateSubscriptionResponse {
  @ApiProperty({
    description: 'ID de la suscripción creada',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID del partner',
    example: 1,
    type: Number,
  })
  partnerId: number;

  @ApiProperty({
    description: 'ID del plan',
    example: 'plan-conecta',
    type: String,
  })
  planId: string;

  @ApiProperty({
    description: 'Tipo de plan',
    example: 'conecta',
    type: String,
  })
  planType: string;

  @ApiProperty({
    description: 'Estado de la suscripción',
    example: 'active',
    type: String,
  })
  status: string;

  @ApiProperty({
    description: 'Fecha de inicio',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  startDate: Date;

  @ApiProperty({
    description: 'Fecha de renovación',
    example: '2025-01-01T00:00:00.000Z',
    type: Date,
  })
  renewalDate: Date;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  createdAt: Date;

  constructor(
    id: number,
    partnerId: number,
    planId: string,
    planType: string,
    status: string,
    startDate: Date,
    renewalDate: Date,
    createdAt: Date,
  ) {
    this.id = id;
    this.partnerId = partnerId;
    this.planId = planId;
    this.planType = planType;
    this.status = status;
    this.startDate = startDate;
    this.renewalDate = renewalDate;
    this.createdAt = createdAt;
  }
}

