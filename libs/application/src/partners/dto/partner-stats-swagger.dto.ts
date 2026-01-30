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

  @ApiProperty({
    example: 5,
    description: 'Número total actual de loyalty programs',
    type: Number,
  })
  loyaltyProgramsCount: number;

  @ApiProperty({
    example: 1,
    description: 'Número actual de loyalty programs tipo BASE',
    type: Number,
  })
  loyaltyProgramsBaseCount: number;

  @ApiProperty({
    example: 3,
    description: 'Número actual de loyalty programs tipo PROMO',
    type: Number,
  })
  loyaltyProgramsPromoCount: number;

  @ApiProperty({
    example: 0,
    description: 'Número actual de loyalty programs tipo PARTNER',
    type: Number,
  })
  loyaltyProgramsPartnerCount: number;

  @ApiProperty({
    example: 0,
    description: 'Número actual de loyalty programs tipo SUBSCRIPTION',
    type: Number,
  })
  loyaltyProgramsSubscriptionCount: number;

  @ApiProperty({
    example: 1,
    description: 'Número actual de loyalty programs tipo EXPERIMENTAL',
    type: Number,
  })
  loyaltyProgramsExperimentalCount: number;
}
