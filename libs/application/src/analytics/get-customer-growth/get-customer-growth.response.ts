import { ApiProperty } from '@nestjs/swagger';

/**
 * Data point de crecimiento de clientes en un período
 */
export class CustomerGrowthDataPointDto {
  @ApiProperty({
    description: 'Fecha de inicio del período',
    example: '2026-01-01',
  })
  periodStart: string;

  @ApiProperty({
    description: 'Fecha de fin del período',
    example: '2026-01-07',
  })
  periodEnd: string;

  @ApiProperty({
    description: 'Label legible del período',
    example: 'Semana 1 Ene',
  })
  label: string;

  @ApiProperty({
    description: 'Nuevos clientes en este período',
    example: 45,
  })
  newCustomers: number;

  @ApiProperty({
    description: 'Total acumulado de clientes hasta este período',
    example: 450,
  })
  cumulativeCustomers: number;

  @ApiProperty({
    description: 'Clientes activos en este período',
    example: 320,
  })
  activeCustomers: number;

  @ApiProperty({
    description: 'Porcentaje de crecimiento vs período anterior',
    example: 12.5,
    nullable: true,
  })
  growthRate: number | null;
}

/**
 * Respuesta del endpoint de customer growth
 */
export class GetCustomerGrowthResponse {
  @ApiProperty({
    type: [CustomerGrowthDataPointDto],
    description: 'Serie temporal de crecimiento de clientes',
  })
  dataPoints: CustomerGrowthDataPointDto[];

  @ApiProperty({
    description: 'Total de nuevos clientes en el período completo',
    example: 180,
  })
  totalNewCustomers: number;

  @ApiProperty({
    description: 'Total acumulado actual de clientes',
    example: 1200,
  })
  totalCustomers: number;

  @ApiProperty({
    description: 'Tasa de crecimiento promedio por período (%)',
    example: 8.5,
  })
  avgGrowthRate: number;

  @ApiProperty({
    description: 'Tipo de agrupación temporal usado',
    example: 'week',
  })
  groupBy: string;

  constructor(
    dataPoints: CustomerGrowthDataPointDto[],
    totalNewCustomers: number,
    totalCustomers: number,
    avgGrowthRate: number,
    groupBy: string,
  ) {
    this.dataPoints = dataPoints;
    this.totalNewCustomers = totalNewCustomers;
    this.totalCustomers = totalCustomers;
    this.avgGrowthRate = avgGrowthRate;
    this.groupBy = groupBy;
  }
}
