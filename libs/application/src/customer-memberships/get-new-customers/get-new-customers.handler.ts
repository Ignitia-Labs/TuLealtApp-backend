import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ITenantRepository, ICustomerMembershipRepository } from '@libs/domain';
import { GetNewCustomersRequest, NewCustomersGroupBy } from './get-new-customers.request';
import { GetNewCustomersResponse, NewCustomersGroupDto } from './get-new-customers.response';
import { PeriodDto } from '../../loyalty/get-loyalty-dashboard/period-dto';

/**
 * Handler para obtener nuevos clientes agrupados por período
 * Optimizado con queries SQL eficientes usando agregaciones
 */
@Injectable()
export class GetNewCustomersHandler {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
  ) {}

  /**
   * Calcula las fechas de inicio y fin según los parámetros
   */
  private calculatePeriodDates(
    groupBy: NewCustomersGroupBy,
    weeks?: number,
    startDate?: string,
    endDate?: string,
  ): { start: Date; end: Date } {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    // Si se especifican fechas explícitas, usarlas
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Invalid date format. Use ISO 8601 format.');
      }
      if (start >= end) {
        throw new BadRequestException('startDate must be before endDate');
      }
      return { start, end };
    }

    // Calcular según groupBy y weeks
    const numWeeks = weeks || 4;
    const start = new Date(now);
    start.setDate(start.getDate() - numWeeks * 7);
    start.setHours(0, 0, 0, 0);

    return { start, end: now };
  }

  async execute(request: GetNewCustomersRequest): Promise<GetNewCustomersResponse> {
    // Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    const groupBy = request.groupBy || 'week';
    const { start: periodStart, end: periodEnd } = this.calculatePeriodDates(
      groupBy,
      request.weeks,
      request.startDate,
      request.endDate,
    );

    // Obtener nuevos clientes agrupados usando query optimizada
    const newCustomersData = await this.membershipRepository.getNewCustomersByPeriod(
      request.tenantId,
      periodStart,
      periodEnd,
      groupBy,
    );

    // Calcular total
    const total = newCustomersData.reduce((sum, group) => sum + group.count, 0);

    // Construir DTOs
    const newCustomers: NewCustomersGroupDto[] = newCustomersData.map(
      (data) =>
        new NewCustomersGroupDto(
          data.label,
          data.startDate,
          data.endDate,
          data.count,
          data.weekNumber,
          data.monthName,
        ),
    );

    const periodDto = new PeriodDto(
      periodStart.toISOString(),
      periodEnd.toISOString(),
      groupBy === 'day' ? 'custom' : groupBy === 'week' ? 'week' : 'month',
    );

    return new GetNewCustomersResponse(newCustomers, total, periodDto);
  }
}
