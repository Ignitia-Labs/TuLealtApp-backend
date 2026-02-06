import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ICustomerMembershipRepository, ITenantRepository } from '@libs/domain';
import { GetCustomerGrowthRequest } from './get-customer-growth.request';
import {
  GetCustomerGrowthResponse,
  CustomerGrowthDataPointDto,
} from './get-customer-growth.response';

/**
 * Handler para obtener evolución histórica de clientes
 * Muestra crecimiento temporal con agrupación por día/semana/mes
 */
@Injectable()
export class GetCustomerGrowthHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(request: GetCustomerGrowthRequest): Promise<GetCustomerGrowthResponse> {
    // 1. Validar tenant
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // 2. Determinar parámetros de agrupación
    const groupBy = request.groupBy || 'week';
    const { startDate, endDate, periods } = this.calculatePeriod(
      groupBy,
      request.periods,
      request.startDate,
      request.endDate,
    );

    // 3. Obtener datos de nuevos clientes por período
    const newCustomersData = await this.membershipRepository.getNewCustomersByPeriod(
      request.tenantId,
      startDate,
      endDate,
      groupBy,
    );

    // 4. Obtener total de clientes actual
    const allMemberships = await this.membershipRepository.findByTenantId(request.tenantId);
    const totalCustomers = allMemberships.length;

    // 5. Calcular acumulados y growth rates
    let cumulativeCount = 0;
    const dataPoints: CustomerGrowthDataPointDto[] = [];
    let previousCount = 0;

    for (const dataPoint of newCustomersData) {
      cumulativeCount += dataPoint.count;

      // Calcular growth rate vs período anterior
      const growthRate =
        previousCount > 0 ? ((dataPoint.count - previousCount) / previousCount) * 100 : null;

      dataPoints.push({
        periodStart: dataPoint.startDate,
        periodEnd: dataPoint.endDate,
        label: dataPoint.label,
        newCustomers: dataPoint.count,
        cumulativeCustomers: cumulativeCount,
        activeCustomers: dataPoint.count, // Simplificación: nuevos = activos
        growthRate: growthRate !== null ? Math.round(growthRate * 100) / 100 : null,
      });

      previousCount = dataPoint.count;
    }

    // 6. Calcular métricas agregadas
    const totalNewCustomers = dataPoints.reduce((sum, dp) => sum + dp.newCustomers, 0);
    const avgGrowthRate =
      dataPoints.filter((dp) => dp.growthRate !== null).length > 0
        ? dataPoints
            .filter((dp) => dp.growthRate !== null)
            .reduce((sum, dp) => sum + (dp.growthRate || 0), 0) /
          dataPoints.filter((dp) => dp.growthRate !== null).length
        : 0;

    // 7. Construir respuesta
    return new GetCustomerGrowthResponse(
      dataPoints,
      totalNewCustomers,
      totalCustomers,
      Math.round(avgGrowthRate * 100) / 100,
      groupBy,
    );
  }

  /**
   * Calcula período de fechas según agrupación
   */
  private calculatePeriod(
    groupBy: 'day' | 'week' | 'month',
    periods?: number,
    startDateStr?: string,
    endDateStr?: string,
  ): { startDate: Date; endDate: Date; periods: number } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    let periodsCount = periods || 4; // Default: 4 períodos

    if (startDateStr && endDateStr) {
      // Custom dates
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);
      return { startDate, endDate, periods: periodsCount };
    }

    // Calcular hacia atrás según groupBy
    switch (groupBy) {
      case 'day':
        periodsCount = periods || 30; // Default: 30 días
        startDate = new Date(now);
        startDate.setDate(now.getDate() - periodsCount);
        break;

      case 'week':
        periodsCount = periods || 12; // Default: 12 semanas
        startDate = new Date(now);
        startDate.setDate(now.getDate() - periodsCount * 7);
        break;

      case 'month':
        periodsCount = periods || 6; // Default: 6 meses
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - periodsCount);
        break;
    }

    return { startDate, endDate, periods: periodsCount };
  }
}
