import { ApiProperty } from '@nestjs/swagger';
import { PeriodDto } from '../../loyalty/get-loyalty-dashboard/period-dto';

/**
 * Segmento de cliente según actividad y comportamiento
 */
export type CustomerSegment = 'VIP' | 'FREQUENT' | 'OCCASIONAL' | 'AT_RISK';

/**
 * Métricas de un segmento de clientes
 */
export class SegmentMetricsDto {
  @ApiProperty({
    description: 'Tipo de segmento',
    enum: ['VIP', 'FREQUENT', 'OCCASIONAL', 'AT_RISK'],
    example: 'VIP',
  })
  segment: CustomerSegment;

  @ApiProperty({
    description: 'Número de clientes en este segmento',
    example: 150,
  })
  count: number;

  @ApiProperty({
    description: 'Porcentaje del total de clientes',
    example: 12.5,
  })
  percentage: number;

  @ApiProperty({
    description: 'Gasto promedio del segmento (revenue)',
    example: 450.75,
  })
  avgSpent: number;

  @ApiProperty({
    description: 'Puntos promedio ganados por cliente',
    example: 2250,
  })
  avgPoints: number;

  @ApiProperty({
    description: 'Promedio de transacciones por cliente',
    example: 8.5,
  })
  avgTransactions: number;
}

/**
 * Insights automáticos generados sobre la segmentación
 */
export class SegmentInsightsDto {
  @ApiProperty({
    description: 'Segmento con mayor revenue total',
    example: 'VIP',
  })
  highestRevenueSegment: CustomerSegment;

  @ApiProperty({
    description: 'Revenue total del segmento con mayor revenue',
    example: 67612.5,
  })
  highestRevenueAmount: number;

  @ApiProperty({
    description: 'Segmento con mayor número de clientes',
    example: 'OCCASIONAL',
  })
  largestSegment: CustomerSegment;

  @ApiProperty({
    description: 'Número de clientes en el segmento más grande',
    example: 450,
  })
  largestSegmentCount: number;

  @ApiProperty({
    description: 'Porcentaje de clientes en riesgo',
    example: 15.2,
  })
  atRiskPercentage: number;

  @ApiProperty({
    description: 'Recomendaciones automáticas basadas en la segmentación',
    example: [
      'El 15% de tus clientes está en riesgo de inactividad',
      'Los clientes VIP generan el 45% del revenue total',
    ],
  })
  recommendations: string[];
}

/**
 * Respuesta del endpoint de segmentación de clientes
 */
export class GetCustomerSegmentationResponse {
  @ApiProperty({
    type: [SegmentMetricsDto],
    description: 'Métricas detalladas por segmento de clientes',
  })
  segments: SegmentMetricsDto[];

  @ApiProperty({
    type: SegmentInsightsDto,
    description: 'Insights automáticos sobre la segmentación',
  })
  insights: SegmentInsightsDto;

  @ApiProperty({
    description: 'Total de clientes analizados',
    example: 1200,
  })
  totalCustomers: number;

  @ApiProperty({
    type: PeriodDto,
    description: 'Período de tiempo analizado',
  })
  period: PeriodDto;

  constructor(
    segments: SegmentMetricsDto[],
    insights: SegmentInsightsDto,
    totalCustomers: number,
    period: PeriodDto,
  ) {
    this.segments = segments;
    this.insights = insights;
    this.totalCustomers = totalCustomers;
    this.period = period;
  }
}
