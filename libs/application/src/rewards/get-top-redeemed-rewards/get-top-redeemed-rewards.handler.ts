import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  ITenantRepository,
  IRewardRepository,
  ILoyaltyProgramRepository,
} from '@libs/domain';
import { GetTopRedeemedRewardsRequest, TopRedeemedRewardsPeriod } from './get-top-redeemed-rewards.request';
import {
  GetTopRedeemedRewardsResponse,
  TopRedeemedRewardDto,
} from './get-top-redeemed-rewards.response';
import { PeriodDto } from '../../loyalty/get-loyalty-dashboard/period-dto';

/**
 * Handler para obtener las recompensas más canjeadas de un tenant
 * Optimizado con queries SQL eficientes usando JOINs y agregaciones
 */
@Injectable()
export class GetTopRedeemedRewardsHandler {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IRewardRepository')
    private readonly rewardRepository: IRewardRepository,
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
  ) {}

  /**
   * Calcula las fechas de inicio y fin según el período especificado
   */
  private calculatePeriodDates(
    period: TopRedeemedRewardsPeriod,
    startDate?: string,
    endDate?: string,
  ): { start: Date; end: Date; periodType: 'all' | 'month' | 'week' | 'custom' } {
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
      return { start, end, periodType: 'custom' };
    }

    if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      return { start, end: now, periodType: 'month' };
    }

    if (period === 'week') {
      const start = new Date(now);
      start.setDate(start.getDate() - 6); // Últimos 7 días
      start.setHours(0, 0, 0, 0);
      return { start, end: now, periodType: 'week' };
    }

    // period === 'all'
    const start = new Date(0); // Desde el inicio de los tiempos
    return { start, end: now, periodType: 'all' };
  }

  async execute(
    request: GetTopRedeemedRewardsRequest,
  ): Promise<GetTopRedeemedRewardsResponse> {
    // Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Calcular período
    const period = request.period || 'month';
    const { start: periodStart, end: periodEnd, periodType } = this.calculatePeriodDates(
      period,
      request.startDate,
      request.endDate,
    );

    const limit = request.limit || 5;

    // Obtener top recompensas canjeadas usando query optimizada
    const topRedeemedData = await this.rewardRepository.getTopRedeemedRewardsByPeriod(
      request.tenantId,
      limit,
      periodStart,
      periodEnd,
    );

    if (topRedeemedData.length === 0) {
      return new GetTopRedeemedRewardsResponse(
        [],
        new PeriodDto(periodStart.toISOString(), periodEnd.toISOString(), periodType),
      );
    }

    // Obtener información completa de las recompensas (batch query)
    const rewardIds = topRedeemedData.map((r) => r.rewardId);
    const rewards = await Promise.all(
      rewardIds.map((rewardId) => this.rewardRepository.findById(rewardId)),
    );

    // Construir DTOs manteniendo el orden de más canjeadas
    // Nota: Reward no tiene programId, icon ni imageUrl en el dominio actual
    // Usamos valores por defecto o null según corresponda
    const rewardDtos: TopRedeemedRewardDto[] = topRedeemedData
      .map((data) => {
        const reward = rewards.find((r) => r?.id === data.rewardId);
        if (!reward) return null;

        return new TopRedeemedRewardDto(
          reward.id,
          reward.name,
          reward.description || '',
          reward.pointsRequired,
          data.timesRedeemed,
          0, // programId - no disponible en Reward actualmente
          'N/A', // programName - no disponible en Reward actualmente
          undefined, // icon - no disponible en Reward actualmente
          reward.image || undefined, // imageUrl - usar campo 'image' de Reward
          undefined, // trend - se puede calcular comparando con período anterior si es necesario
        );
      })
      .filter((r): r is TopRedeemedRewardDto => r !== null);

    const periodDto = new PeriodDto(
      periodStart.toISOString(),
      periodEnd.toISOString(),
      periodType,
    );

    return new GetTopRedeemedRewardsResponse(rewardDtos, periodDto);
  }
}
