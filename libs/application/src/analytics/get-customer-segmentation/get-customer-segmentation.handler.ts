import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPointsTransactionRepository, ITenantRepository } from '@libs/domain';
import { GetCustomerSegmentationRequest } from './get-customer-segmentation.request';
import {
  GetCustomerSegmentationResponse,
  SegmentMetricsDto,
  SegmentInsightsDto,
  CustomerSegment,
} from './get-customer-segmentation.response';
import { PeriodDto } from '../../loyalty/get-loyalty-dashboard/period-dto';

/**
 * Handler para obtener segmentación de clientes basada en comportamiento
 *
 * Lógica de segmentación:
 * - VIP: >=10 transacciones Y revenue >$500
 * - FREQUENT: 5-9 transacciones O revenue $200-$500
 * - OCCASIONAL: 2-4 transacciones O revenue $50-$200
 * - AT_RISK: 1 transacción O revenue <$50
 */
@Injectable()
export class GetCustomerSegmentationHandler {
  constructor(
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(request: GetCustomerSegmentationRequest): Promise<GetCustomerSegmentationResponse> {
    // 1. Validar tenant
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // 2. Calcular período
    const { startDate, endDate, periodType } = this.calculatePeriod(
      request.period,
      request.startDate,
      request.endDate,
    );

    // 3. Obtener datos agregados de clientes desde el repository
    // TODO: Esta query necesita ser implementada en el repository
    const customerData = await this.getCustomerDataForSegmentation(
      request.tenantId,
      startDate,
      endDate,
    );

    // 4. Segmentar clientes según criterios
    const segmentedCustomers = customerData.map((customer) => ({
      ...customer,
      segment: this.segmentCustomer(customer.transactionCount, customer.totalRevenue),
    }));

    // 5. Agregar métricas por segmento
    const segments = this.aggregateSegmentMetrics(segmentedCustomers);

    // 6. Generar insights
    const insights = this.generateSegmentInsights(segments, segmentedCustomers.length);

    // 7. Construir respuesta
    return new GetCustomerSegmentationResponse(
      segments,
      insights,
      segmentedCustomers.length,
      new PeriodDto(startDate.toISOString(), endDate.toISOString(), periodType),
    );
  }

  /**
   * Obtiene datos agregados por cliente para segmentación
   * Esta query debe contar transacciones, sumar revenue y sumar puntos por membershipId
   */
  private async getCustomerDataForSegmentation(
    tenantId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<
    Array<{
      membershipId: number;
      transactionCount: number;
      totalRevenue: number;
      totalPoints: number;
    }>
  > {
    return this.pointsTransactionRepository.getCustomerDataForSegmentation(
      tenantId,
      startDate,
      endDate,
    );
  }

  /**
   * Segmenta un cliente según número de transacciones y revenue
   */
  private segmentCustomer(transactionCount: number, totalRevenue: number): CustomerSegment {
    // VIP: >=10 transacciones Y revenue >$500
    if (transactionCount >= 10 && totalRevenue > 500) {
      return 'VIP';
    }

    // FREQUENT: 5-9 transacciones O revenue $200-$500
    if (transactionCount >= 5 || totalRevenue >= 200) {
      return 'FREQUENT';
    }

    // OCCASIONAL: 2-4 transacciones O revenue $50-$200
    if (transactionCount >= 2 || totalRevenue >= 50) {
      return 'OCCASIONAL';
    }

    // AT_RISK: 1 transacción O revenue <$50
    return 'AT_RISK';
  }

  /**
   * Agrega métricas por segmento
   */
  private aggregateSegmentMetrics(
    segmentedCustomers: Array<{
      membershipId: number;
      transactionCount: number;
      totalRevenue: number;
      totalPoints: number;
      segment: CustomerSegment;
    }>,
  ): SegmentMetricsDto[] {
    const segmentMap = new Map<
      CustomerSegment,
      {
        count: number;
        totalRevenue: number;
        totalPoints: number;
        totalTransactions: number;
      }
    >();

    // Inicializar todos los segmentos
    const segments: CustomerSegment[] = ['VIP', 'FREQUENT', 'OCCASIONAL', 'AT_RISK'];
    segments.forEach((seg) => {
      segmentMap.set(seg, {
        count: 0,
        totalRevenue: 0,
        totalPoints: 0,
        totalTransactions: 0,
      });
    });

    // Agregar datos
    for (const customer of segmentedCustomers) {
      const segData = segmentMap.get(customer.segment)!;
      segData.count += 1;
      segData.totalRevenue += customer.totalRevenue;
      segData.totalPoints += customer.totalPoints;
      segData.totalTransactions += customer.transactionCount;
    }

    // Calcular promedios y porcentajes
    const totalCustomers = segmentedCustomers.length || 1;

    return segments.map((segment) => {
      const data = segmentMap.get(segment)!;
      const count = data.count;

      return {
        segment,
        count,
        percentage: Math.round((count / totalCustomers) * 10000) / 100,
        avgSpent: count > 0 ? Math.round((data.totalRevenue / count) * 100) / 100 : 0,
        avgPoints: count > 0 ? Math.round(data.totalPoints / count) : 0,
        avgTransactions: count > 0 ? Math.round((data.totalTransactions / count) * 100) / 100 : 0,
      };
    });
  }

  /**
   * Genera insights automáticos sobre la segmentación
   */
  private generateSegmentInsights(
    segments: SegmentMetricsDto[],
    totalCustomers: number,
  ): SegmentInsightsDto {
    // Segmento con mayor revenue
    const segmentRevenues = segments.map((s) => ({
      segment: s.segment,
      totalRevenue: s.count * s.avgSpent,
    }));
    const highestRevenue = segmentRevenues.reduce((max, curr) =>
      curr.totalRevenue > max.totalRevenue ? curr : max,
    );

    // Segmento más grande
    const largestSegment = segments.reduce((max, curr) => (curr.count > max.count ? curr : max));

    // Porcentaje en riesgo
    const atRiskSegment = segments.find((s) => s.segment === 'AT_RISK')!;
    const atRiskPercentage = atRiskSegment.percentage;

    // Generar recomendaciones
    const recommendations: string[] = [];

    if (atRiskPercentage > 20) {
      recommendations.push(
        `⚠️ ${atRiskPercentage.toFixed(1)}% de tus clientes está en riesgo de inactividad. Considera campañas de reactivación.`,
      );
    } else if (atRiskPercentage > 10) {
      recommendations.push(
        `${atRiskPercentage.toFixed(1)}% de tus clientes está en riesgo de inactividad.`,
      );
    }

    const vipSegment = segments.find((s) => s.segment === 'VIP')!;
    const vipRevenue = vipSegment.count * vipSegment.avgSpent;
    const totalRevenue = segmentRevenues.reduce((sum, s) => sum + s.totalRevenue, 0);
    if (totalRevenue > 0) {
      const vipRevenuePercentage = Math.round((vipRevenue / totalRevenue) * 100);
      if (vipRevenuePercentage >= 40) {
        recommendations.push(
          `🌟 Los clientes VIP generan el ${vipRevenuePercentage}% del revenue total. Prioriza su experiencia.`,
        );
      }
    }

    const frequentSegment = segments.find((s) => s.segment === 'FREQUENT')!;
    if (frequentSegment.count > vipSegment.count * 2) {
      recommendations.push(
        `📈 Tienes ${frequentSegment.count} clientes frecuentes que podrían convertirse en VIP con incentivos adecuados.`,
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Tu distribución de segmentos es saludable.');
    }

    return {
      highestRevenueSegment: highestRevenue.segment,
      highestRevenueAmount: Math.round(highestRevenue.totalRevenue * 100) / 100,
      largestSegment: largestSegment.segment,
      largestSegmentCount: largestSegment.count,
      atRiskPercentage: Math.round(atRiskPercentage * 100) / 100,
      recommendations,
    };
  }

  /**
   * Calcula período de fechas
   */
  private calculatePeriod(
    period?: 'all' | 'month' | 'week' | 'custom',
    startDateStr?: string,
    endDateStr?: string,
  ): { startDate: Date; endDate: Date; periodType: 'all' | 'month' | 'week' | 'custom' } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    let periodType: 'all' | 'month' | 'week' | 'custom' = period || 'month';

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;

      case 'month':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;

      case 'custom':
        if (!startDateStr || !endDateStr) {
          throw new Error('startDate and endDate are required for custom period');
        }
        startDate = new Date(startDateStr);
        endDate = new Date(endDateStr);
        break;

      case 'all':
      default:
        startDate = new Date('2020-01-01');
        periodType = 'all';
        break;
    }

    return { startDate, endDate, periodType };
  }
}
