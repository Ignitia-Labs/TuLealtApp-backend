import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IGoalRepository } from '@libs/domain';
import { GetGoalProgressRequest } from './get-goal-progress.request';
import {
  GetGoalProgressResponse,
  ProgressInfo,
  ProjectionInfo,
  TrendInfo,
} from './get-goal-progress.response';
import { GetSubscriptionStatsHandler } from '../../subscriptions/get-subscription-stats/get-subscription-stats.handler';
import { GetSubscriptionStatsRequest } from '../../subscriptions/get-subscription-stats/get-subscription-stats.request';
import { GoalProgressService } from '../goal-progress.service';

/**
 * Handler para obtener el progreso detallado de una meta
 */
@Injectable()
export class GetGoalProgressHandler {
  constructor(
    @Inject('IGoalRepository')
    private readonly goalRepository: IGoalRepository,
    private readonly getSubscriptionStatsHandler: GetSubscriptionStatsHandler,
    private readonly goalProgressService: GoalProgressService,
  ) {}

  async execute(request: GetGoalProgressRequest): Promise<GetGoalProgressResponse> {
    const goal = await this.goalRepository.findById(request.goalId);

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${request.goalId} not found`);
    }

    const currentDate = new Date();

    // Obtener estadísticas del período actual
    const statsRequest = new GetSubscriptionStatsRequest();
    statsRequest.startDate = goal.periodStart.toISOString();
    statsRequest.endDate = goal.periodEnd.toISOString();
    const currentStats = await this.getSubscriptionStatsHandler.execute(statsRequest);

    // Calcular valor actual
    const currentValue = goal.calculateCurrentValue({
      mrr: currentStats.mrr,
      arr: currentStats.arr,
      activeSubscriptions: currentStats.activeSubscriptions,
      churnRate: currentStats.churnRate,
      retentionRate: currentStats.retentionRate,
      newSubscriptions: currentStats.newSubscriptions,
      upgrades: currentStats.upgrades,
    });

    // Calcular progreso
    const progressInfo = this.goalProgressService.calculateProgress(goal, currentValue);
    const progress = new ProgressInfo(
      progressInfo.currentValue,
      progressInfo.targetValue,
      progressInfo.progress,
    );

    // Calcular proyección
    const projectionInfo = this.goalProgressService.calculateProjection(
      goal,
      currentValue,
      currentDate,
    );
    const projection = new ProjectionInfo(
      projectionInfo.projectedValue,
      projectionInfo.projectedProgress,
    );

    // Determinar estado
    const status = goal.determineStatus(progress.progress, projection.projectedProgress);

    // Calcular tendencia comparando con período anterior equivalente
    let trend: TrendInfo | null = null;
    try {
      const periodDuration = goal.periodEnd.getTime() - goal.periodStart.getTime();
      const previousPeriodStart = new Date(goal.periodStart.getTime() - periodDuration);
      const previousPeriodEnd = goal.periodStart;

      const previousStatsRequest = new GetSubscriptionStatsRequest();
      previousStatsRequest.startDate = previousPeriodStart.toISOString();
      previousStatsRequest.endDate = previousPeriodEnd.toISOString();
      const previousStats = await this.getSubscriptionStatsHandler.execute(previousStatsRequest);

      const previousValue = goal.calculateCurrentValue({
        mrr: previousStats.mrr,
        arr: previousStats.arr,
        activeSubscriptions: previousStats.activeSubscriptions,
        churnRate: previousStats.churnRate,
        retentionRate: previousStats.retentionRate,
        newSubscriptions: previousStats.newSubscriptions,
        upgrades: previousStats.upgrades,
      });

      const trendInfo = this.goalProgressService.calculateTrend(goal, currentValue, previousValue);
      trend = new TrendInfo(trendInfo.change, trendInfo.changePercentage);
    } catch (error) {
      // Si no hay datos del período anterior, la tendencia será null
      trend = null;
    }

    return new GetGoalProgressResponse(goal.id, progress, projection, status, trend, currentDate);
  }
}
