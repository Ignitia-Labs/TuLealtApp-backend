import { ApiProperty } from '@nestjs/swagger';
import { PeriodDto } from '../../loyalty/get-loyalty-dashboard/period-dto';

/**
 * DTO que representa las métricas de una sucursal
 */
export class BranchMetricsDto {
  @ApiProperty({
    description: 'ID de la sucursal',
    example: 1,
  })
  branchId: number;

  @ApiProperty({
    description: 'Nombre de la sucursal',
    example: 'Café Delicia - Centro',
  })
  branchName: string;

  @ApiProperty({
    description: 'Total de clientes únicos que visitaron esta sucursal',
    example: 245,
  })
  totalCustomers: number;

  @ApiProperty({
    description: 'Clientes activos en el período (con al menos 1 transacción)',
    example: 180,
  })
  activeCustomers: number;

  @ApiProperty({
    description: 'Revenue total generado por esta sucursal',
    example: 45230.50,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Número de transacciones con revenue',
    example: 320,
  })
  transactionCount: number;

  @ApiProperty({
    description: 'Ticket promedio de compra',
    example: 141.35,
  })
  avgTicket: number;

  @ApiProperty({
    description: 'Total de recompensas canjeadas en esta sucursal',
    example: 45,
  })
  rewardsRedeemed: number;

  @ApiProperty({
    description: 'Moneda de las métricas',
    example: 'GTQ',
  })
  currency: string;

  @ApiProperty({
    description: 'Score de rendimiento de la sucursal (0-100, calculado con revenue, clientes y redemptions)',
    example: 85.5,
  })
  performanceScore: number;
}

/**
 * DTO de response para métricas agregadas de todas las sucursales
 */
export class GetAllBranchesMetricsResponse {
  @ApiProperty({
    description: 'Lista de métricas por sucursal',
    type: BranchMetricsDto,
    isArray: true,
  })
  branches: BranchMetricsDto[];

  @ApiProperty({
    description: 'Métricas agregadas de todas las sucursales',
    example: {
      totalCustomers: 450,
      totalActiveCustomers: 320,
      totalRevenue: 125340.75,
      totalRewardsRedeemed: 120,
      avgTicket: 145.50,
    },
  })
  totals: {
    /** Total de clientes únicos en toda la red */
    totalCustomers: number;
    /** Total de clientes activos */
    totalActiveCustomers: number;
    /** Revenue total de todas las sucursales */
    totalRevenue: number;
    /** Total de recompensas canjeadas */
    totalRewardsRedeemed: number;
    /** Ticket promedio ponderado */
    avgTicket: number;
  };

  @ApiProperty({
    description: 'Período consultado',
    type: PeriodDto,
  })
  period: PeriodDto;

  constructor(
    branches: BranchMetricsDto[],
    totals: {
      totalCustomers: number;
      totalActiveCustomers: number;
      totalRevenue: number;
      totalRewardsRedeemed: number;
      avgTicket: number;
    },
    period: PeriodDto,
  ) {
    this.branches = branches;
    this.totals = totals;
    this.period = period;
  }
}
