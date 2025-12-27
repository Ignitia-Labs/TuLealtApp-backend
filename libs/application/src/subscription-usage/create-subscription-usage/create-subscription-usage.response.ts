import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para crear un registro de uso de suscripción
 */
export class CreateSubscriptionUsageResponse {
  @ApiProperty({
    description: 'ID del registro de uso creado',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID de la suscripción',
    example: 1,
    type: Number,
  })
  partnerSubscriptionId: number;

  @ApiProperty({
    description: 'Número de tenants',
    example: 2,
    type: Number,
  })
  tenantsCount: number;

  @ApiProperty({
    description: 'Número de branches',
    example: 8,
    type: Number,
  })
  branchesCount: number;

  @ApiProperty({
    description: 'Número de customers',
    example: 2345,
    type: Number,
  })
  customersCount: number;

  @ApiProperty({
    description: 'Número de rewards',
    example: 15,
    type: Number,
  })
  rewardsCount: number;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  createdAt: Date;

  constructor(
    id: number,
    partnerSubscriptionId: number,
    tenantsCount: number,
    branchesCount: number,
    customersCount: number,
    rewardsCount: number,
    createdAt: Date,
  ) {
    this.id = id;
    this.partnerSubscriptionId = partnerSubscriptionId;
    this.tenantsCount = tenantsCount;
    this.branchesCount = branchesCount;
    this.customersCount = customersCount;
    this.rewardsCount = rewardsCount;
    this.createdAt = createdAt;
  }
}

