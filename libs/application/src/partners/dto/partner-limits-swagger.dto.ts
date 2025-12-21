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
}
