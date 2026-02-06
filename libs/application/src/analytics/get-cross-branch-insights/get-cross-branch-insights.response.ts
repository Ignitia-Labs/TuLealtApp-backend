import { ApiProperty } from '@nestjs/swagger';
import { PeriodDto } from '../../loyalty/get-loyalty-dashboard/period-dto';

/**
 * Combinación de sucursales visitadas por clientes
 */
export class BranchCombinationDto {
  @ApiProperty({
    description: 'IDs de las sucursales en la combinación',
    example: [1, 3],
  })
  branchIds: number[];

  @ApiProperty({
    description: 'Nombres de las sucursales',
    example: ['Café Centro', 'Café Norte'],
  })
  branchNames: string[];

  @ApiProperty({
    description: 'Número de clientes que visitan esta combinación',
    example: 45,
  })
  customerCount: number;

  @ApiProperty({
    description: 'Porcentaje del total de clientes multi-sucursal',
    example: 25.5,
  })
  percentage: number;

  @ApiProperty({
    description: 'Revenue total generado por estos clientes',
    example: 12500.75,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Revenue promedio por cliente',
    example: 277.8,
  })
  avgRevenuePerCustomer: number;
}

/**
 * Insights de clientes cross-branch
 */
export class CrossBranchInsightsDto {
  @ApiProperty({
    description: 'Porcentaje de clientes que visitan múltiples sucursales',
    example: 35.5,
  })
  multiBranchPercentage: number;

  @ApiProperty({
    description: 'Revenue promedio de clientes multi-sucursal vs single-branch',
    example: 45.2,
  })
  revenueUplift: number;

  @ApiProperty({
    description: 'Número promedio de sucursales visitadas por cliente multi-sucursal',
    example: 2.3,
  })
  avgBranchesPerCustomer: number;

  @ApiProperty({
    description: 'Recomendaciones basadas en patrones cross-branch',
    example: [
      '35% de tus clientes visitan múltiples sucursales',
      'Clientes multi-sucursal gastan 45% más en promedio',
    ],
  })
  recommendations: string[];
}

/**
 * Respuesta del endpoint de cross-branch insights
 */
export class GetCrossBranchInsightsResponse {
  @ApiProperty({
    type: [BranchCombinationDto],
    description: 'Top combinaciones de sucursales visitadas',
  })
  topCombinations: BranchCombinationDto[];

  @ApiProperty({
    type: CrossBranchInsightsDto,
    description: 'Insights sobre comportamiento cross-branch',
  })
  insights: CrossBranchInsightsDto;

  @ApiProperty({
    description: 'Total de clientes analizados',
    example: 1200,
  })
  totalCustomers: number;

  @ApiProperty({
    description: 'Total de clientes multi-sucursal',
    example: 426,
  })
  multiBranchCustomers: number;

  @ApiProperty({
    type: PeriodDto,
    description: 'Período de tiempo analizado',
  })
  period: PeriodDto;

  constructor(
    topCombinations: BranchCombinationDto[],
    insights: CrossBranchInsightsDto,
    totalCustomers: number,
    multiBranchCustomers: number,
    period: PeriodDto,
  ) {
    this.topCombinations = topCombinations;
    this.insights = insights;
    this.totalCustomers = totalCustomers;
    this.multiBranchCustomers = multiBranchCustomers;
    this.period = period;
  }
}
