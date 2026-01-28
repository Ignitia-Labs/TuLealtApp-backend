import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para documentación Swagger de PricingPlanLimits
 * Representa los límites de un plan de precios para Swagger
 */
export class PricingPlanLimitsSwaggerDto {
  @ApiProperty({ example: 1, description: 'ID de los límites' })
  id: number;

  @ApiProperty({ example: 1, description: 'ID del plan de precios' })
  pricingPlanId: number;

  @ApiProperty({
    example: 1,
    description: 'Máximo número de tenants (-1 para ilimitado)',
  })
  maxTenants: number;

  @ApiProperty({
    example: 5,
    description: 'Máximo número de branches (-1 para ilimitado)',
  })
  maxBranches: number;

  @ApiProperty({
    example: 1000,
    description: 'Máximo número de customers (-1 para ilimitado)',
  })
  maxCustomers: number;

  @ApiProperty({
    example: 50,
    description: 'Máximo número de rewards (-1 para ilimitado)',
  })
  maxRewards: number;

  @ApiProperty({
    example: 3,
    description: 'Máximo número de admins (-1 para ilimitado)',
  })
  maxAdmins: number;

  @ApiProperty({
    example: 10,
    description: 'Almacenamiento en GB (-1 para ilimitado)',
  })
  storageGB: number;

  @ApiProperty({
    example: 10000,
    description: 'Llamadas API por mes (-1 para ilimitado)',
  })
  apiCallsPerMonth: number;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Fecha de creación',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-11-14T00:00:00.000Z',
    description: 'Fecha de última actualización',
  })
  updatedAt: Date;
}
