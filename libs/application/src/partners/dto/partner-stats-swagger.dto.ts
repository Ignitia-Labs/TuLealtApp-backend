import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para documentación Swagger de PartnerStats
 */
export class PartnerStatsSwaggerDto {
  @ApiProperty({
    example: 3,
    description: 'Número actual de tenants',
    type: Number,
  })
  tenantsCount: number;

  @ApiProperty({
    example: 8,
    description: 'Número actual de branches',
    type: Number,
  })
  branchesCount: number;

  @ApiProperty({
    example: 1250,
    description: 'Número actual de clientes',
    type: Number,
  })
  customersCount: number;

  @ApiProperty({
    example: 15,
    description: 'Número actual de recompensas',
    type: Number,
  })
  rewardsCount: number;
}
