import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para documentación Swagger de PartnerLimits
 */
export class PartnerLimitsSwaggerDto {
  @ApiProperty({
    example: 5,
    description: 'Número máximo de tenants permitidos',
    type: Number,
  })
  maxTenants: number;

  @ApiProperty({
    example: 20,
    description: 'Número máximo de branches permitidas',
    type: Number,
  })
  maxBranches: number;

  @ApiProperty({
    example: 5000,
    description: 'Número máximo de clientes permitidos',
    type: Number,
  })
  maxCustomers: number;

  @ApiProperty({
    example: 50,
    description: 'Número máximo de recompensas permitidas',
    type: Number,
  })
  maxRewards: number;

  @ApiProperty({
    example: -1,
    description: 'Número máximo de administradores permitidos (-1 para ilimitado)',
    type: Number,
  })
  maxAdmins: number;

  @ApiProperty({
    example: -1,
    description: 'Almacenamiento en GB permitido (-1 para ilimitado)',
    type: Number,
  })
  storageGB: number;

  @ApiProperty({
    example: -1,
    description: 'Número máximo de llamadas API por mes (-1 para ilimitado)',
    type: Number,
  })
  apiCallsPerMonth: number;

  @ApiProperty({
    example: 5,
    description: 'Número máximo total de loyalty programs permitidos (-1 para ilimitado)',
    type: Number,
  })
  maxLoyaltyPrograms: number;

  @ApiProperty({
    example: 1,
    description: 'Número máximo de loyalty programs tipo BASE permitidos (-1 para ilimitado)',
    type: Number,
  })
  maxLoyaltyProgramsBase: number;

  @ApiProperty({
    example: 3,
    description: 'Número máximo de loyalty programs tipo PROMO permitidos (-1 para ilimitado)',
    type: Number,
  })
  maxLoyaltyProgramsPromo: number;

  @ApiProperty({
    example: 0,
    description: 'Número máximo de loyalty programs tipo PARTNER permitidos (-1 para ilimitado)',
    type: Number,
  })
  maxLoyaltyProgramsPartner: number;

  @ApiProperty({
    example: 0,
    description: 'Número máximo de loyalty programs tipo SUBSCRIPTION permitidos (-1 para ilimitado)',
    type: Number,
  })
  maxLoyaltyProgramsSubscription: number;

  @ApiProperty({
    example: 0,
    description: 'Número máximo de loyalty programs tipo EXPERIMENTAL permitidos (-1 para ilimitado)',
    type: Number,
  })
  maxLoyaltyProgramsExperimental: number;
}
