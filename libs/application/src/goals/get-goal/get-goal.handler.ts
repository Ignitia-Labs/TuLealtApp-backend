import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IGoalRepository, Goal } from '@libs/domain';
import { GetSubscriptionStatsHandler } from '../../subscriptions/get-subscription-stats/get-subscription-stats.handler';
import { GetSubscriptionStatsRequest } from '../../subscriptions/get-subscription-stats/get-subscription-stats.request';
import { GoalProgressService } from '../goal-progress.service';
import { GetGoalRequest } from './get-goal.request';
import { GetGoalResponse } from './get-goal.response';

/**
 * Handler para obtener una meta por ID con cálculo de progreso
 */
@Injectable()
export class GetGoalHandler {
  constructor(
    @Inject('IGoalRepository')
    private readonly goalRepository: IGoalRepository,
    private readonly getSubscriptionStatsHandler: GetSubscriptionStatsHandler,
    private readonly goalProgressService: GoalProgressService,
  ) {}

  async execute(request: GetGoalRequest): Promise<GetGoalResponse> {
    const goal = await this.goalRepository.findById(request.goalId);

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${request.goalId} not found`);
    }

    // Obtener estadísticas del período de la meta
    const statsRequest = new GetSubscriptionStatsRequest();
    statsRequest.startDate = goal.periodStart.toISOString();
    statsRequest.endDate = goal.periodEnd.toISOString();
    const stats = await this.getSubscriptionStatsHandler.execute(statsRequest);

    // Calcular valor actual según la métrica
    const currentValue = goal.calculateCurrentValue({
      mrr: stats.mrr,
      arr: stats.arr,
      activeSubscriptions: stats.activeSubscriptions,
      churnRate: stats.churnRate,
      retentionRate: stats.retentionRate,
      newSubscriptions: stats.newSubscriptions,
      upgrades: stats.upgrades,
    });

    // Calcular progreso
    const progress = goal.calculateProgress(currentValue);

    // Calcular proyección
    const projectionInfo = this.goalProgressService.calculateProjection(
      goal,
      currentValue,
      new Date(),
    );

    // Determinar estado
    const status = goal.determineStatus(progress, projectionInfo.projectedProgress);

    return new GetGoalResponse(
      goal.id,
      goal.name,
      goal.description,
      goal.metric,
      goal.targetValue,
      currentValue,
      progress,
      status,
      goal.periodStart,
      goal.periodEnd,
      goal.isActive,
      goal.createdAt,
      goal.updatedAt,
    );
  }
}
