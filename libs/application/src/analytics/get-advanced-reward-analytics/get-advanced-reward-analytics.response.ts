import { ApiProperty } from '@nestjs/swagger';
import { PeriodDto } from '../../loyalty/get-loyalty-dashboard/period-dto';
import { CustomerSegment } from '../get-customer-segmentation/get-customer-segmentation.response';

/**
 * Métricas avanzadas de una recompensa específica
 */
export class AdvancedRewardMetricsDto {
  @ApiProperty({
    description: 'ID de la regla de recompensa',
    example: 5,
  })
  ruleId: number;

  @ApiProperty({
    description: 'Nombre de la recompensa',
    example: 'Café Gratis',
  })
  rewardName: string;

  @ApiProperty({
    description: 'Número de canjes de esta recompensa',
    example: 150,
  })
  redemptionsCount: number;

  @ApiProperty({
    description: 'Total de puntos canjeados',
    example: 7500,
  })
  pointsRedeemed: number;

  @ApiProperty({
    description: 'Revenue generado antes de los canjes (earned)',
    example: 12500.5,
  })
  revenueGenerated: number;

  @ApiProperty({
    description: 'ROI de la recompensa: (revenue / costoEstimado) * 100',
    example: 250.5,
  })
  roi: number;

  @ApiProperty({
    description: 'Eficiencia: revenue / puntos canjeados',
    example: 1.67,
  })
  efficiency: number;

  @ApiProperty({
    description: 'Segmento de cliente que más canjea esta recompensa',
    enum: ['VIP', 'FREQUENT', 'OCCASIONAL', 'AT_RISK'],
    example: 'VIP',
  })
  topSegment: CustomerSegment;

  @ApiProperty({
    description: 'Sucursal donde más se canjea esta recompensa',
    example: 1,
  })
  topBranchId: number;

  @ApiProperty({
    description: 'Nombre de la sucursal top',
    example: 'Café Delicia - Centro',
  })
  topBranchName: string;

  @ApiProperty({
    description: 'Tendencia vs período anterior (porcentaje de cambio)',
    example: 15.5,
  })
  trend: number;
}

/**
 * Respuesta del endpoint de analytics avanzados de recompensas
 */
export class GetAdvancedRewardAnalyticsResponse {
  @ApiProperty({
    type: [AdvancedRewardMetricsDto],
    description: 'Lista de métricas avanzadas por recompensa',
  })
  rewards: AdvancedRewardMetricsDto[];

  @ApiProperty({
    description: 'Total de canjes en el período',
    example: 450,
  })
  totalRedemptions: number;

  @ApiProperty({
    description: 'Revenue total generado por clientes que canjearon',
    example: 45000.75,
  })
  totalRevenueGenerated: number;

  @ApiProperty({
    description: 'ROI promedio de todas las recompensas',
    example: 185.2,
  })
  avgROI: number;

  @ApiProperty({
    type: PeriodDto,
    description: 'Período de tiempo analizado',
  })
  period: PeriodDto;

  constructor(
    rewards: AdvancedRewardMetricsDto[],
    totalRedemptions: number,
    totalRevenueGenerated: number,
    avgROI: number,
    period: PeriodDto,
  ) {
    this.rewards = rewards;
    this.totalRedemptions = totalRedemptions;
    this.totalRevenueGenerated = totalRevenueGenerated;
    this.avgROI = avgROI;
    this.period = period;
  }
}
